"use client"

import { useState } from "react"
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
import { Eye, Edit, Archive, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

const ITEMS_PER_PAGE = 25

interface Log {
  id: string
  type: string
  title: string
  description: string
  status: string
  createdAt: Date
  location: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
  }
  severity?: string | null
}

interface LogsTableProps {
  logs: Log[]
  onViewLog: (logId: string) => void
  onEditLog?: (logId: string) => void
  onArchiveLog?: (logId: string) => void
}

const logTypeColors: Record<string, string> = {
  INCIDENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PATROL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VISITOR_CHECKIN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  WEATHER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ON_DUTY_CHECKLIST: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

const statusColors: Record<string, string> = {
  LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  ARCHIVED: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
}

export function LogsTable({ logs, onViewLog, onEditLog, onArchiveLog }: LogsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentLogs = logs.slice(startIndex, endIndex)

  // Reset to page 1 when logs change (e.g., filter applied)
  const logsLength = logs.length
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No logs found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className={logTypeColors[log.type] || logTypeColors.OTHER}>
                    {log.type.replace(/_/g, " ")}
                  </Badge>
                  {log.severity && (
                    <Badge className={severityColors[log.severity]} variant="secondary">
                      {log.severity}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  <p className="font-medium truncate">{log.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {log.description}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">{log.location.name}</TableCell>
              <TableCell>
                {log.user.firstName} {log.user.lastName}
              </TableCell>
              <TableCell className="text-sm">
                {formatDateTime(log.createdAt)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[log.status] || statusColors.DRAFT}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewLog(log.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onEditLog && log.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditLog(log.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onArchiveLog && log.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onArchiveLog(log.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Pagination Controls */}
    {totalPages > 1 && (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, logs.length)} of {logs.length} logs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
    </div>
  )
}
