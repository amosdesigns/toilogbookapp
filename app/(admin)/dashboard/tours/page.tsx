import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { getTours } from "@/lib/actions/tour-actions"
import { getActiveLocations } from "@/lib/actions/location-actions"
import { ToursListClient } from "./tours-list-client"

export default async function ToursPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Only supervisors and above can access tours
  if (user.role === "GUARD") {
    redirect("/")
  }

  // Fetch tours and locations
  const [toursResult, locationsResult] = await Promise.all([
    getTours(),
    getActiveLocations()
  ])

  const tours = toursResult.ok ? toursResult.data : []
  const locations = locationsResult.ok ? locationsResult.data : []

  return <ToursListClient user={user} tours={tours} locations={locations} />
}
