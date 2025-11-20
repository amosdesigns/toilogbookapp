"use server"

import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

/**
 * Syncs Clerk user with database
 * Creates user if doesn't exist, updates if exists
 * This is the ONLY place where we sync Clerk -> Database
 */
export async function syncUserToDatabase() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return { success: false, error: "Not authenticated" }
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      return { success: false, error: "No email found in Clerk user" }
    }

    // Check if user exists by Clerk ID
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    // If not found by Clerk ID, check by email (handles existing users from seed data)
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({
        where: { email },
      })

      // If found by email, update the clerkId
      if (dbUser) {
        console.log(`[SYNC] Found existing user by email, updating clerkId`)
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId: clerkUser.id,
            firstName: clerkUser.firstName || dbUser.firstName || "Unknown",
            lastName: clerkUser.lastName || dbUser.lastName || "User",
          },
        })
        console.log(`[SYNC] User updated with Clerk ID:`, dbUser)
      }
    }

    // If user still doesn't exist, create them
    if (!dbUser) {
      console.log(`[SYNC] Creating new user for Clerk ID: ${clerkUser.id}`)

      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || "Unknown",
          lastName: clerkUser.lastName || "User",
          // Default role is GUARD - admins can change this in database
          role: "GUARD",
        },
      })

      console.log(`[SYNC] User created successfully:`, dbUser)
    } else {
      // Update user info if it changed in Clerk
      // (we only update basic info, NOT the role - role is managed in database)
      const needsUpdate =
        dbUser.email !== email ||
        dbUser.firstName !== clerkUser.firstName ||
        dbUser.lastName !== clerkUser.lastName

      if (needsUpdate) {
        console.log(`[SYNC] Updating user info for: ${dbUser.email}`)

        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            email,
            firstName: clerkUser.firstName || dbUser.firstName || "Unknown",
            lastName: clerkUser.lastName || dbUser.lastName || "User",
            // NOTE: We do NOT update role - that's managed in database only
          },
        })
      }
    }

    return { success: true, user: dbUser }
  } catch (error) {
    console.error("[SYNC] Error syncing user:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to sync user"
    return { success: false, error: errorMessage }
  }
}

/**
 * Gets user from database by Clerk ID
 * This is the primary way to get user data in the app
 */
export async function getCurrentUser() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    return dbUser
  } catch (error) {
    console.error("[GET_USER] Error getting user:", error)
    return null
  }
}
