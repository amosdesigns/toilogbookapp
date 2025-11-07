"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Mail,
  Shield,
  Clock,
  FileText,
  MapPin,
  Calendar,
  Edit2,
  LogOut,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import { getMyProfile, getMyDutySessions, getMyLogs, updateMyProfile } from "@/app/actions"
import { SignOutButton } from "@clerk/nextjs"

interface ProfileData {
  imageUrl: string | null
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  username: string | null
  role: string
  createdAt: Date
  stats: {
    totalLogs: number
    totalDutySessions: number
    totalLocationCheckIns: number
    totalDutyHours: number
  }
}

interface DutySession {
  id: string
  clockInTime: Date
  clockOutTime: Date | null
  location: { name: string } | null
  duration: string
}

interface Log {
  id: string
  type: string
  title: string
  status: string
  createdAt: Date
  location: { name: string } | null
}

const roleColors = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SUPERVISOR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  GUARD: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [dutySessions, setDutySessions] = useState<DutySession[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)

      // Fetch profile with stats
      const profileResult = await getMyProfile()
      if (profileResult.success && profileResult.profile) {
        setProfile(profileResult.profile as any)
        setFirstName(profileResult.profile.firstName || "")
        setLastName(profileResult.profile.lastName || "")
      }

      // Fetch recent duty sessions
      const sessionsResult = await getMyDutySessions(5)
      if (sessionsResult.success) {
        setDutySessions(sessionsResult.dutySessions as any || [])
      }

      // Fetch recent logs
      const logsResult = await getMyLogs(5)
      if (logsResult.success) {
        setLogs(logsResult.logs as any || [])
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true)
      const result = await updateMyProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile")
      }

      toast.success("Profile updated successfully!")
      setEditDialogOpen(false)
      fetchProfileData() // Refresh data
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="shrink-0">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.firstName || profile.lastName
                    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                    : "No name set"}
                </h1>
                <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profile.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Shield className="h-4 w-4" />
                <Badge className={roleColors[profile.role as keyof typeof roleColors]}>
                  {profile.role.replace("_", " ")}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your personal information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setEditDialogOpen(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <SignOutButton>
                <Button variant="outline" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalDutyHours}h</div>
            <p className="text-xs text-muted-foreground">Time on duty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duty Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalDutySessions}</div>
            <p className="text-xs text-muted-foreground">Total shifts worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Log Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Reports created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalLocationCheckIns}</div>
            <p className="text-xs text-muted-foreground">Location visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent duty sessions and log entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sessions">Duty Sessions</TabsTrigger>
              <TabsTrigger value="logs">Log Entries</TabsTrigger>
            </TabsList>

            {/* Duty Sessions Tab */}
            <TabsContent value="sessions" className="space-y-3 mt-4">
              {dutySessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No duty sessions yet</p>
                </div>
              ) : (
                <>
                  {dutySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {session.location ? session.location.name : "Roaming Duty"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(session.clockInTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={session.clockOutTime ? "outline" : "default"}>
                          {session.duration}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/shifts">View All Sessions</Link>
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-3 mt-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No log entries yet</p>
                </div>
              ) : (
                <>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{log.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.location?.name || "No location"} • {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{log.type.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/logs">View All Logs</Link>
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
