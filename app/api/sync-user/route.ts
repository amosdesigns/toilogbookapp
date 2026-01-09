import { NextResponse } from "next/server"
import { syncUserToDatabase } from "@/lib/auth/sync-user"
import { currentUser } from "@clerk/nextjs/server"

/**
 * Manual user sync endpoint for troubleshooting
 * GET /api/sync-user - Syncs current Clerk user to database
 *
 * Usage:
 * - Navigate to /api/sync-user in browser while logged in
 * - Or call from client: fetch('/api/sync-user')
 */
export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated with Clerk",
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    console.log('[SYNC_API] Syncing user:', clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress)

    const result = await syncUserToDatabase()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "User synced successfully",
        user: {
          id: result.user?.id,
          email: result.user?.email,
          role: result.user?.role,
          clerkId: result.user?.clerkId
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[SYNC_API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
