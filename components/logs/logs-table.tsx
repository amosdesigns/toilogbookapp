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
import { Eye, Edit, Archive } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

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
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No logs found matching your filters.</p>
      </div>
    )
  }

  return (
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
          {logs.map((log) => (
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
  )
}
