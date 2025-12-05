"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { to, type Result } from "@/lib/utils/RenderError"
import { generateIncidentNumber } from "@/lib/validations/incident-report"
import { revalidatePath } from "next/cache"

/**
 * Get supervisors who can be notified about incident reports
 * Returns only supervisors (not admins or super admins)
 */
export async function getSupervisorsForNotification(): Promise<
  Result<
    Array<{
      id: string
      firstName: string
      lastName: string
      email: string
    }>
  >
> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: "Unauthorized" }
    }

    // Only supervisors and higher can access this
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return { ok: false, message: "Only supervisors and higher can access user list" }
    }

    // Get all active supervisors
    const supervisors = await prisma.user.findMany({
      where: {
        role: "SUPERVISOR",
        archivedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ lastName: "asc" }],
    })

    return {
      ok: true,
      data: supervisors,
    }
  } catch (error) {
    console.error("[GET_SUPERVISORS_FOR_NOTIFICATION]", error)
    return to(error)
  }
}

/**
 * Check if current user can generate incident reports
 * Only supervisors and higher can generate reports
 */
export async function canGenerateIncidentReport(): Promise<Result<boolean>> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: "Unauthorized" }
    }

    const canGenerate = ["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(
      currentUser.role
    )

    return {
      ok: true,
      data: canGenerate,
    }
  } catch (error) {
    console.error("[CAN_GENERATE_INCIDENT_REPORT]", error)
    return to(error)
  }
}

/**
 * Check if an incident report can be created for a specific log
 * Returns false if report already exists for this log
 */
export async function canCreateReportForLog(
  logId: string
): Promise<Result<boolean>> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: "Unauthorized" }
    }

    // Check if user can generate reports
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return { ok: true, data: false }
    }

    // Check if report already exists for this log
    const existingReport = await prisma.incidentReportGeneration.findUnique({
      where: { logId },
    })

    return {
      ok: true,
      data: !existingReport, // Can create if no report exists
    }
  } catch (error) {
    console.error("[CAN_CREATE_REPORT_FOR_LOG]", error)
    return to(error)
  }
}

interface CreateIncidentReportData {
  guardAssignedId?: string | null
  supervisorAssignedId: string
  notifyUserIds: string[]
}

/**
 * Create an incident report from a log
 * Only supervisors and higher can create reports
 * One report per log (enforced by unique constraint)
 */
export async function createIncidentReport(
  logId: string,
  data: CreateIncidentReportData
): Promise<Result<{ id: string; incidentNumber: string }>> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { ok: false, message: "Unauthorized" }
    }

    // Verify user is supervisor or higher
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) {
      return { ok: false, message: "Only supervisors and higher can create incident reports" }
    }

    // Fetch the log to verify it exists and is an incident
    const log = await prisma.log.findUnique({
      where: { id: logId },
      include: {
        location: true,
        user: true,
      },
    })

    if (!log) {
      return { ok: false, message: "Log not found" }
    }

    if (log.type !== "INCIDENT") {
      return { ok: false, message: "Can only create incident reports for incident-type logs" }
    }

    // Check if report already exists
    const existingReport = await prisma.incidentReportGeneration.findUnique({
      where: { logId },
    })

    if (existingReport) {
      return { ok: false, message: "An incident report already exists for this log" }
    }

    // Generate incident number from log ID
    const incidentNumber = generateIncidentNumber(logId)

    // Create the incident report
    const report = await prisma.incidentReportGeneration.create({
      data: {
        logId,
        incidentNumber,
        generatedBy: currentUser.id,
        guardAssignedId: data.guardAssignedId,
        supervisorAssignedId: data.supervisorAssignedId,
        notifiedUsers: data.notifyUserIds,
      },
    })

    // TODO: Send notifications to selected supervisors
    // This will be implemented when we build the notification system

    // Revalidate paths
    revalidatePath("/dashboard/logs")
    revalidatePath(`/logs/${logId}`)

    return {
      ok: true,
      data: {
        id: report.id,
        incidentNumber: report.incidentNumber,
      },
      message: "Incident report created successfully",
    }
  } catch (error) {
    console.error("[CREATE_INCIDENT_REPORT]", error)
    return to(error)
  }
}
