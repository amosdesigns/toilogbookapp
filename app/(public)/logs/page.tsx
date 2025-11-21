"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Eye, Pencil, Trash2, Filter, X, Plus } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { LogForm } from "@/components/forms/log-form"
import { getLogs, getLogById, updateLog, deleteLog, createLog } from "@/lib/actions/logs"
import { getCurrentUserAction } from "@/lib/actions/users"
import { getActiveLocations } from "@/lib/actions/locations"
import { getActiveDutySession } from "@/lib/actions/duty-session-actions"

interface Log {
  id: string
  type: string
  title: string
  description: string
  status: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null
  locationId: string
  userId: string
  createdAt: Date
  location: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
  }
}

const severityColors = {
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const typeColors = {
  INCIDENT: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PATROL: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  VISITOR_CHECKIN: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  MAINTENANCE: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  WEATHER: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  OTHER: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filter states
  const [search, setSearch] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>("all")

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [activeDutySession, setActiveDutySession] = useState<any>(null)

  useEffect(() => {
    fetchLocations()
    fetchCurrentUser()
    fetchLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, search, selectedLocation, selectedType, selectedStatus, selectedYear, selectedMonth, selectedDayOfWeek])

  const fetchLocations = async () => {
    try {
      const result = await getActiveLocations()
      if (!result.ok) {
        console.error('Error fetching locations:', result.message)
      } else {
        setLocations(result.data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const result = await getCurrentUserAction()
      if (!result.ok) {
        console.error('Error fetching current user:', result.message)
      } else {
        setCurrentUser(result.data)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const result = await getLogs()
      if (!result.ok) {
        toast.error(result.message)
      } else {
        setLogs(result.data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.title.toLowerCase().includes(searchLower) ||
          log.description.toLowerCase().includes(searchLower)
      )
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((log) => log.locationId === selectedLocation)
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((log) => log.type === selectedType)
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((log) => log.status === selectedStatus)
    }

    // Year filter
    if (selectedYear !== "all") {
      const year = parseInt(selectedYear)
      filtered = filtered.filter((log) => new Date(log.createdAt).getFullYear() === year)
    }

    // Month filter
    if (selectedMonth !== "all") {
      const month = parseInt(selectedMonth)
      filtered = filtered.filter((log) => new Date(log.createdAt).getMonth() === month)
    }

    // Day of week filter
    if (selectedDayOfWeek !== "all") {
      const dayOfWeek = parseInt(selectedDayOfWeek)
      filtered = filtered.filter((log) => new Date(log.createdAt).getDay() === dayOfWeek)
    }

    setFilteredLogs(filtered)
  }

  const handleViewLog = async (logId: string) => {
    try {
      const result = await getLogById(logId)
      if (!result.ok) {
        toast.error(result.message)
      } else {
        setSelectedLog(result.data)
        setViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching log details:', error)
      toast.error('Failed to fetch log details')
    }
  }

  const handleEditLog = async (logId: string) => {
    try {
      const result = await getLogById(logId)
      if (!result.ok) {
        toast.error(result.message)
      } else {
        setSelectedLog(result.data)
        setEditDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching log details:', error)
      toast.error('Failed to fetch log details')
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to archive this log?')) {
      return
    }

    try {
      const result = await deleteLog(logId)
      if (!result.ok) {
        toast.error(result.message)
      } else {
        toast.success(result.message || 'Log archived successfully')
        fetchLogs()
      }
    } catch (error) {
      console.error('Error deleting log:', error)
      toast.error('Failed to archive log')
    }
  }

  const handleCreateLog = async () => {
    // For guards, check if they're on duty
    if (currentUser?.role === 'GUARD') {
      try {
        const result = await getActiveDutySession()
        if (!result.ok) {
          toast.error(result.message)
          return
        }

        if (!result.data) {
          toast.error('You must be on duty to create a log')
          return
        }

        if (!result.data.locationId) {
          toast.error('You must be assigned to a location to create a log')
          return
        }

        setActiveDutySession(result.data)
        setCreateDialogOpen(true)
      } catch (error) {
        console.error('Error checking duty session:', error)
        toast.error('Failed to verify duty status')
      }
    } else {
      // Supervisors and above can create logs without being on duty
      setActiveDutySession(null)
      setCreateDialogOpen(true)
    }
  }

  const canManageLog = (log: Log) => {
    if (!currentUser) return false

    // Supervisors and above can manage any log
    if (['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(currentUser.role)) {
      return true
    }

    // Guards can only manage their own logs
    return currentUser.id === log.userId
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedLocation("all")
    setSelectedType("all")
    setSelectedStatus("all")
    setSelectedYear(new Date().getFullYear().toString())
    setSelectedMonth("all")
    setSelectedDayOfWeek("all")
  }

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-muted-foreground">View and manage all security logs</p>
        </div>
        <Button onClick={handleCreateLog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter logs by location, date, type, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="INCIDENT">Incident</SelectItem>
                  <SelectItem value="PATROL">Patrol</SelectItem>
                  <SelectItem value="VISITOR_CHECKIN">Visitor Check-in</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="WEATHER">Weather</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="UPDATED">Updated</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Day of Week</label>
              <Select value={selectedDayOfWeek} onValueChange={setSelectedDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  {daysOfWeek.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            All Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={typeColors[log.type as keyof typeof typeColors]}>
                          {log.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {log.title}
                      </TableCell>
                      <TableCell>{log.location.name}</TableCell>
                      <TableCell>
                        {log.user.firstName} {log.user.lastName}
                      </TableCell>
                      <TableCell>
                        {log.severity && (
                          <Badge className={severityColors[log.severity]}>
                            {log.severity}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLog(log.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageLog(log) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLog(log.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>Full information about this log entry</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="mt-1">
                    <Badge className={typeColors[selectedLog.type as keyof typeof typeColors]}>
                      {selectedLog.type.replace('_', ' ')}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1">
                    <Badge variant="outline">{selectedLog.status}</Badge>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="mt-1 font-medium">{selectedLog.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 whitespace-pre-wrap">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="mt-1">{selectedLog.location?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="mt-1">
                    {selectedLog.user?.firstName} {selectedLog.user?.lastName}
                  </p>
                </div>
              </div>

              {selectedLog.severity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <p className="mt-1">
                    <Badge className={severityColors[selectedLog.severity as keyof typeof severityColors]}>
                      {selectedLog.severity}
                    </Badge>
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="mt-1">{formatDateTime(selectedLog.createdAt)}</p>
              </div>

              {selectedLog.incidentTime && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Incident Time</label>
                  <p className="mt-1">{formatDateTime(selectedLog.incidentTime)}</p>
                </div>
              )}

              {selectedLog.peopleInvolved && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">People Involved</label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedLog.peopleInvolved}</p>
                </div>
              )}

              {selectedLog.witnesses && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Witnesses</label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedLog.witnesses}</p>
                </div>
              )}

              {selectedLog.actionsTaken && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actions Taken</label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedLog.actionsTaken}</p>
                </div>
              )}

              {selectedLog.reviewNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Review Notes</label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedLog.reviewNotes}</p>
                  {selectedLog.reviewer && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reviewed by: {selectedLog.reviewer.firstName} {selectedLog.reviewer.lastName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Log</DialogTitle>
            <DialogDescription>Update log information</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <LogForm
              onSubmit={async (data) => {
                const result = await updateLog(selectedLog.id, data)
                if (!result.ok) {
                  toast.error(result.message)
                } else {
                  setEditDialogOpen(false)
                  fetchLogs()
                  toast.success(result.message || 'Log updated successfully')
                }
              }}
              defaultValues={{
                title: selectedLog.title,
                description: selectedLog.description,
                type: selectedLog.type,
                status: selectedLog.status,
                locationId: selectedLog.locationId,
                shiftId: selectedLog.shiftId,
              }}
              locations={locations}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Log</DialogTitle>
            <DialogDescription>
              {currentUser?.role === 'GUARD'
                ? 'Create a new log entry for your current duty location'
                : 'Create a new log entry for any location'}
            </DialogDescription>
          </DialogHeader>
          <LogForm
            onSubmit={async (data) => {
              console.log('Form submitted with data:', data)
              const result = await createLog(data)
              console.log('Create log result:', result)
              if (!result.ok) {
                toast.error(result.message)
              } else {
                setCreateDialogOpen(false)
                setActiveDutySession(null)
                fetchLogs()
                toast.success(result.message || 'Log created successfully')
              }
            }}
            defaultValues={{
              type: "PATROL",
              status: "LIVE",
              locationId: activeDutySession?.locationId || "",
              title: "",
              description: "",
            }}
            locations={locations}
            disableLocation={currentUser?.role === 'GUARD'}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
