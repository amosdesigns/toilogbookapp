import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { LogManagementClient } from "./log-management-client"
import { getActiveLocations } from "@/lib/actions/location-actions"

export default async function LogManagementPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Only supervisors and above can access log management
  if (user.role === "GUARD") {
    redirect("/")
  }

  // Fetch locations for filters
  const locationsResult = await getActiveLocations()
  const locations = locationsResult.ok ? locationsResult.data : []

  return <LogManagementClient user={user} locations={locations} />
}
