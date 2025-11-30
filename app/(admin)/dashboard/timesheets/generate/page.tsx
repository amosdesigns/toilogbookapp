import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { GenerateTimesheetClient } from "./generate-timesheet-client"

export default async function GenerateTimesheetPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Only supervisors and above can generate timesheets
  if (user.role === "GUARD") {
    redirect("/")
  }

  return <GenerateTimesheetClient user={user} />
}
