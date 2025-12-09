"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { to, type ActionResult } from "@/lib/utils/RenderError";
import { Prisma } from "@prisma/client";

// Type for the full incident report with relations
export type IncidentReportWithDetails =
  Prisma.IncidentReportGenerationGetPayload<{
    include: {
      log: {
        include: {
          location: true;
          user: true;
        };
      };
    };
  }>;

interface GenerateIncidentReportInput {
  logId: string;
  guardAssignedId?: string;
  supervisorAssignedId: string;
  notifiedUserIds?: string[];
}

interface SignIncidentReportInput {
  reportId: string;
  signerType: "guard" | "supervisor";
  ipAddress?: string;
}

/**
 * Generate an incident report from a log entry
 * Only supervisors and above can generate reports
 */
export async function generateIncidentReport(
  input: GenerateIncidentReportInput
): Promise<ActionResult<IncidentReportWithDetails>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, message: "Unauthorized - Please sign in" };
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!user) {
      return { ok: false, message: "User not found" };
    }

    // Only supervisors and above can generate reports
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return {
        ok: false,
        message: "Only supervisors can generate incident reports",
      };
    }

    // Check if log exists
    const log = await prisma.log.findUnique({
      where: { id: input.logId },
      include: { location: true, user: true },
    });

    if (!log) {
      return { ok: false, message: "Log not found" };
    }

    // Check if report already exists for this log
    const existingReport = await prisma.incidentReportGeneration.findUnique({
      where: { logId: input.logId },
    });

    if (existingReport) {
      return {
        ok: false,
        message: "An incident report already exists for this log",
      };
    }

    // Generate incident number: INC-YYYY-{logId}
    const year = new Date().getFullYear();
    const incidentNumber = `INC-${year}-${input.logId.slice(-8).toUpperCase()}`;

    // Create the incident report
    const report = await prisma.incidentReportGeneration.create({
      data: {
        logId: input.logId,
        incidentNumber,
        generatedBy: user.id,
        guardAssignedId: input.guardAssignedId || null,
        supervisorAssignedId: input.supervisorAssignedId,
        notifiedUsers: input.notifiedUserIds || [],
      },
      include: {
        log: {
          include: {
            location: true,
            user: true,
          },
        },
      },
    });

    // TODO: Send notifications to selected supervisors
    // This would integrate with your notification system

    return {
      ok: true,
      data: report,
      message: `Incident report ${incidentNumber} created successfully`,
    };
  } catch (error) {
    console.error("Error generating incident report:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate incident report",
    };
  }
}

/**
 * Sign an incident report (guard or supervisor signature)
 */
export async function signIncidentReport(
  input: SignIncidentReportInput
): Promise<ActionResult<IncidentReportWithDetails>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, message: "Unauthorized - Please sign in" };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!user) {
      return { ok: false, message: "User not found" };
    }

    // Get the report
    const report = await prisma.incidentReportGeneration.findUnique({
      where: { id: input.reportId },
    });

    if (!report) {
      return { ok: false, message: "Incident report not found" };
    }

    // Check if user is assigned to sign
    if (input.signerType === "guard") {
      if (!report.guardAssignedId || report.guardAssignedId !== user.id) {
        return {
          ok: false,
          message: "You are not assigned to sign as guard on this report",
        };
      }
      if (report.guardSignedBy) {
        return {
          ok: false,
          message: "This report has already been signed by the guard",
        };
      }
    } else if (input.signerType === "supervisor") {
      if (report.supervisorAssignedId !== user.id) {
        return {
          ok: false,
          message: "You are not assigned to sign as supervisor on this report",
        };
      }
      if (report.supervisorSignedBy) {
        return {
          ok: false,
          message: "This report has already been signed by the supervisor",
        };
      }
    }

    const fullName = `${user.firstName} ${user.lastName}`;
    const now = new Date();

    // Update the report with signature
    const updateData: Prisma.IncidentReportGenerationUpdateInput = {};

    if (input.signerType === "guard") {
      updateData.guardSignedBy = user.id;
      updateData.guardSignedByName = fullName;
      updateData.guardSignedAt = now;
      updateData.guardIpAddress = input.ipAddress || null;
    } else if (input.signerType === "supervisor") {
      updateData.supervisorSignedBy = user.id;
      updateData.supervisorSignedByName = fullName;
      updateData.supervisorSignedAt = now;
      updateData.supervisorIpAddress = input.ipAddress || null;
    }

    const updatedReport = await prisma.incidentReportGeneration.update({
      where: { id: input.reportId },
      data: updateData,
      include: {
        log: {
          include: {
            location: true,
            user: true,
          },
        },
      },
    });

    return {
      ok: true,
      data: updatedReport,
      message: `Report signed successfully by ${input.signerType}`,
    };
  } catch (error) {
    console.error("Error signing incident report:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to sign incident report",
    };
  }
}

/**
 * Get incident report by ID
 */
export async function getIncidentReport(
  reportId: string
): Promise<ActionResult<IncidentReportWithDetails>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, message: "Unauthorized - Please sign in" };
    }

    const report = await prisma.incidentReportGeneration.findUnique({
      where: { id: reportId },
      include: {
        log: {
          include: {
            location: true,
            user: true,
          },
        },
      },
    });

    if (!report) {
      return { ok: false, message: "Incident report not found" };
    }

    return {
      ok: true,
      data: report,
    };
  } catch (error) {
    console.error("Error fetching incident report:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch incident report",
    };
  }
}

/**
 * Get incident report by log ID
 */
export async function getIncidentReportByLogId(
  logId: string
): Promise<ActionResult<IncidentReportWithDetails | null>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, message: "Unauthorized - Please sign in" };
    }

    const report = await prisma.incidentReportGeneration.findUnique({
      where: { logId },
      include: {
        log: {
          include: {
            location: true,
            user: true,
          },
        },
      },
    });

    return {
      ok: true,
      data: report,
    };
  } catch (error) {
    console.error("Error fetching incident report by log ID:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch incident report",
    };
  }
}

/**
 * Get all incident reports (for supervisors+)
 */
export async function getAllIncidentReports(): Promise<
  ActionResult<IncidentReportWithDetails[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, message: "Unauthorized - Please sign in" };
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return { ok: false, message: "User not found" };
    }

    // Only supervisors and above can view all reports
    if (!["SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return { ok: false, message: "Unauthorized - Supervisors only" };
    }

    const reports = await prisma.incidentReportGeneration.findMany({
      include: {
        log: {
          include: {
            location: true,
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      ok: true,
      data: reports,
    };
  } catch (error) {
    console.error("Error fetching incident reports:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch incident reports",
    };
  }
}
