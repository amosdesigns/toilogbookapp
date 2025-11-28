"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Archive, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"
import { updateUserRole, archiveUser, unarchiveUser } from "@/lib/actions/user-management-actions"
import type { UserManagementData } from "@/lib/actions/user-management-actions"
import type { UserRole } from "@/lib/types"

interface UserManagementTableProps {
  users: UserManagementData[]
  currentUserRole: UserRole
  onUpdate: (updatedUser: UserManagementData) => void
}

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ADMIN: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  SUPERVISOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  GUARD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

const roleOptions: UserRole[] = ["GUARD", "SUPERVISOR", "ADMIN", "SUPER_ADMIN"]

export function UserManagementTable({
  users,
  currentUserRole,
  onUpdate,
}: UserManagementTableProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId)
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.ok && result.data) {
        toast.success("User role updated successfully")
        onUpdate(result.data)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to update user role")
      console.error(error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleArchive = async (userId: string) => {
    if (!confirm("Are you sure you want to archive this user? They will be prevented from logging in.")) {
      return
    }

    setUpdatingUserId(userId)
    try {
      const result = await archiveUser(userId)
      if (result.ok && result.data) {
        toast.success("User archived successfully")
        onUpdate(result.data)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to archive user")
      console.error(error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleUnarchive = async (userId: string) => {
    setUpdatingUserId(userId)
    try {
      const result = await unarchiveUser(userId)
      if (result.ok && result.data) {
        toast.success("User unarchived successfully")
        onUpdate(result.data)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to unarchive user")
      console.error(error)
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const isArchived = !!user.archivedAt
              const isUpdating = updatingUserId === user.id

              return (
                <TableRow
                  key={user.id}
                  className={isArchived ? "opacity-50 bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                    {user.username && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        @{user.username}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      disabled={isArchived || isUpdating}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue asChild>
                          <Badge className={roleColors[user.role]}>
                            {user.role.replace("_", " ")}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>
                    {user.streetAddress || user.city || user.state || user.zipCode ? (
                      <div className="text-sm">
                        {user.streetAddress && <div>{user.streetAddress}</div>}
                        {(user.city || user.state || user.zipCode) && (
                          <div className="text-muted-foreground">
                            {[user.city, user.state, user.zipCode].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {isArchived && user.archivedAt ? (
                      <div>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          ARCHIVED
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(user.archivedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ACTIVE
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isArchived ? (
                      currentUserRole === "SUPER_ADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnarchive(user.id)}
                          disabled={isUpdating}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Unarchive
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(user.id)}
                        disabled={isUpdating}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
