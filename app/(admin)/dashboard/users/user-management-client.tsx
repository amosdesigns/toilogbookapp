"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { Search, Users } from "lucide-react"
import { toast } from "sonner"
import { getAllUsersForManagement } from "@/lib/actions/user-management-actions"
import type { UserManagementData } from "@/lib/actions/user-management-actions"
import type { UserRole } from "@/lib/types"

interface UserManagementClientProps {
  userRole: UserRole
}

export function UserManagementClient({ userRole }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserManagementData[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const pageSize = 25

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const result = await getAllUsersForManagement(searchTerm || undefined, currentPage, pageSize)
      if (result.ok && result.data) {
        setUsers(result.data.users)
        setTotal(result.data.total)
      } else {
        toast.error(result.message || "Failed to load users")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchTerm("")
    setCurrentPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const handleUserUpdate = (updatedUser: UserManagementData) => {
    // Optimistically update the user in the local state
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles and access control
        </p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.filter((u) => !u.archivedAt).length}
              </div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.archivedAt).length}
              </div>
              <div className="text-xs text-muted-foreground">Archived Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "ADMIN").length}
              </div>
              <div className="text-xs text-muted-foreground">Administrators</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
            {searchTerm && (
              <Button variant="outline" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {searchTerm
              ? `Showing ${users.length} of ${total} users matching "${searchTerm}"`
              : `Showing ${users.length} of ${total} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : (
            <>
              <UserManagementTable
                users={users}
                currentUserRole={userRole}
                onUpdate={handleUserUpdate}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
