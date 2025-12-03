"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getUsersWithDutySessions, generateTimesheet } from "@/lib/actions/timesheet-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, User as UserIcon } from "lucide-react"
import type { UserWithDutySessions } from "@/lib/types/prisma-types"

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface GenerateTimesheetClientProps {
  user: User
}

export function GenerateTimesheetClient({ user }: GenerateTimesheetClientProps) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [availableUsers, setAvailableUsers] = useState<UserWithDutySessions[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Get recent weeks for selection
  const getRecentWeeks = () => {
    const weeks = []
    const today = new Date()

    for (let i = 0; i < 8; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (i * 7))
      const day = date.getDay()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - day)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      weeks.push({
        value: weekStart.toISOString().split('T')[0],
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      })
    }

    return weeks
  }

  const recentWeeks = getRecentWeeks()

  // Fetch users with duty sessions when week is selected
  useEffect(() => {
    if (selectedWeek) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true)
        const result = await getUsersWithDutySessions({ weekStartDate: selectedWeek })
        if (result.ok) {
          setAvailableUsers(result.data as UserWithDutySessions[])
        } else {
          toast.error(result.message || "Failed to fetch users")
          setAvailableUsers([])
        }
        setIsLoadingUsers(false)
      }
      fetchUsers()
    } else {
      setAvailableUsers([])
      setSelectedUserId("")
    }
  }, [selectedWeek])

  const handleGenerate = async () => {
    if (!selectedUserId || !selectedWeek) {
      toast.error("Please select both a week and an employee")
      return
    }

    setIsGenerating(true)
    const result = await generateTimesheet({
      userId: selectedUserId,
      weekStartDate: selectedWeek,
    })

    setIsGenerating(false)

    if (result.ok) {
      toast.success(result.message || "Timesheet generated successfully")
      router.push("/admin/dashboard/timesheets")
    } else {
      toast.error(result.message || "Failed to generate timesheet")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/dashboard/timesheets")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Generate Timesheet</h1>
          <p className="text-muted-foreground mt-1">
            Create a new timesheet from completed duty sessions
          </p>
        </div>
      </div>

      {/* Generation Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Select Week and Employee</CardTitle>
          <CardDescription>
            Choose a week period and an employee who has completed duty sessions during that week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Week Selection */}
          <div className="space-y-2">
            <Label htmlFor="week" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Week Period
            </Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger id="week">
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent>
                {recentWeeks.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Timesheets are generated for Sunday - Saturday periods
            </p>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Employee
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={!selectedWeek || isLoadingUsers}
            >
              <SelectTrigger id="user">
                <SelectValue
                  placeholder={
                    !selectedWeek
                      ? "Select a week first"
                      : isLoadingUsers
                      ? "Loading employees..."
                      : availableUsers.length === 0
                      ? "No employees with duty sessions"
                      : "Select an employee"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((availableUser) => (
                  <SelectItem key={availableUser.id} value={availableUser.id}>
                    {availableUser.firstName} {availableUser.lastName}
                    {availableUser.role && (
                      <span className="text-muted-foreground ml-2">
                        ({availableUser.role})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedWeek
                ? "Only employees with completed duty sessions for the selected week are shown"
                : "Select a week to see available employees"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!selectedUserId || !selectedWeek || isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : "Generate Timesheet"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard/timesheets")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="max-w-2xl bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. Select a week period (Sunday - Saturday)
          </p>
          <p>
            2. Choose an employee who worked during that week
          </p>
          <p>
            3. The system will automatically pull all completed duty sessions and calculate total hours
          </p>
          <p>
            4. A draft timesheet will be created that can be reviewed, submitted, and approved
          </p>
          <p className="pt-2 text-xs">
            Note: You cannot generate a timesheet if one already exists for the selected employee and week.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
