"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { syncUserToDatabase } from "@/lib/auth/sync-user"

/**
 * @deprecated This component is no longer used as of 2025-01-09
 *
 * User sync is now handled server-side via `getCurrentUserWithSync()` in layouts.
 * This eliminates hydration errors and race conditions.
 *
 * Keeping this file for reference only - it's not imported anywhere.
 *
 * This component automatically syncs Clerk users to the database
 * Add it to your root layout so it runs on every page load
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncComplete, setSyncComplete] = useState(false)

  useEffect(() => {
    async function syncUser() {
      // Only sync if user is loaded and we haven't synced yet
      if (!isLoaded || !user || syncComplete || isSyncing) {
        return
      }

      try {
        setIsSyncing(true)
        console.log("[USER_SYNC] Syncing user to database...")

        const result = await syncUserToDatabase()

        if (result.success) {
          console.log("[USER_SYNC] ✅ User synced successfully")
          setSyncComplete(true)
        } else {
          console.error("[USER_SYNC] ❌ Sync failed:", result.error)
        }
      } catch (error) {
        console.error("[USER_SYNC] ❌ Sync error:", error)
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [user, isLoaded, syncComplete, isSyncing])

  // Show children regardless of sync status
  // The sync happens in the background
  return <>{children}</>
}
