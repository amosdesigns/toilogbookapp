import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { TimesheetManagementClient } from "./timesheet-management-client"
import { prisma } from "@/lib/prisma"

export default async function TimesheetManagementPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Only supervisors and above can access timesheet management
  if (user.role === "GUARD") {
    redirect("/")
  }

  // Fetch all users for filters (guards and supervisors who have duty sessions)
  const users = await prisma.user.findMany({
    where: {
      dutySessions: {
        some: {},
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' },
    ],
  })

  return <TimesheetManagementClient user={user} users={users} />
}
