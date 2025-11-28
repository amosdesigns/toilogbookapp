import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { UserManagementClient } from "./user-management-client"

export default async function UserManagementPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Server-side authorization check
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/")
  }

  return <UserManagementClient userRole={user.role} />
}
