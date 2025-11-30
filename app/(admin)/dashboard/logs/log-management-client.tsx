"use client"

import { useState, useEffect } from "react"
import { LogFiltersHorizontal, type LogFilters as LogFiltersType } from "@/components/logs/log-filters-horizontal"
import { LogsTable } from "@/components/logs/logs-table"
import { LogDetailDialog } from "@/components/logs/log-detail-dialog"
import { getLogs, getLogById, deleteLog } from "@/lib/actions/logs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface Location {
  id: string
  name: string
}

interface LogManagementClientProps {
  user: User
  locations: Location[]
}

export function LogManagementClient({ user, locations }: LogManagementClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<LogFiltersType>({})
  const [logs, setLogs] = useState<any[]>([])
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Fetch logs whenever filters change
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      const result = await getLogs(filters)
      if (result.ok) {
        setLogs(result.data)
      } else {
        toast.error(result.message || "Failed to fetch logs")
      }
      setIsLoading(false)
    }

    fetchLogs()
  }, [filters])

  const handleViewLog = async (logId: string) => {
    const result = await getLogById(logId)
    if (result.ok) {
      setSelectedLog(result.data)
      setIsDetailDialogOpen(true)
    } else {
      toast.error(result.message || "Failed to load log details")
    }
  }

  const handleEditLog = (logId: string) => {
    // Navigate to edit page (we'll create this later)
    router.push(`/admin/dashboard/logs/${logId}/edit`)
  }

  const handleArchiveLog = async (logId: string) => {
    if (!confirm("Are you sure you want to archive this log?")) return

    const result = await deleteLog(logId)
    if (result.ok) {
      toast.success("Log archived successfully")
      // Refresh logs
      const updatedLogs = await getLogs(filters)
      if (updatedLogs.ok) {
        setLogs(updatedLogs.data)
      }
    } else {
      toast.error(result.message || "Failed to archive log")
    }
  }

  const handleExport = () => {
    // Export logs to CSV (simple implementation)
    const csvContent = [
      ["Type", "Title", "Location", "Created By", "Date", "Status"],
      ...logs.map((log) => [
        log.type,
        log.title,
        log.location.name,
        `${log.user.firstName} ${log.user.lastName}`,
        new Date(log.createdAt).toLocaleDateString(),
        log.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `logs-export-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Logs exported successfully")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Log Management</h1>
          <p className="text-muted-foreground mt-1">
            View, filter, and manage all logbook entries across locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push("/logs/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Log
          </Button>
        </div>
      </div>

      {/* Filters - Horizontal at top */}
      <LogFiltersHorizontal
        filters={filters}
        onFiltersChange={setFilters}
        locations={locations}
      />

      {/* Logs Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${logs.length} log(s) found`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <LogsTable
            logs={logs}
            onViewLog={handleViewLog}
            onEditLog={handleEditLog}
            onArchiveLog={handleArchiveLog}
          />
        )}
      </Card>

      {/* Log Detail Dialog */}
      <LogDetailDialog
        log={selectedLog}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  )
}
