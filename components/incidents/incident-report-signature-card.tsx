"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertCircle,
  PenTool,
} from "lucide-react";
import { format } from "date-fns";
import { signIncidentReport } from "@/lib/actions/incident-report-generation-actions";
import type { IncidentReportWithDetails } from "@/lib/actions/incident-report-generation-actions";
import { IncidentReportPDF } from "@/components/pdf/incident-report-pdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IncidentReportSignatureCardProps {
  report: IncidentReportWithDetails;
  currentUserId: string;
  currentUserRole: string;
  onSignatureComplete?: () => void;
}

export function IncidentReportSignatureCard({
  report,
  currentUserId,
  currentUserRole,
  onSignatureComplete,
}: IncidentReportSignatureCardProps) {
  const [isSigning, setIsSigning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signerType, setSignerType] = useState<"guard" | "supervisor" | null>(
    null
  );

  // Check if current user can sign
  const canSignAsGuard =
    report.guardAssignedId === currentUserId && !report.guardSignedBy;
  const canSignAsSupervisor =
    report.supervisorAssignedId === currentUserId && !report.supervisorSignedBy;

  // Check signature status
  const guardSigned = !!report.guardSignedBy;
  const supervisorSigned = !!report.supervisorSignedBy;
  const allSigned =
    (!report.guardAssignedId || guardSigned) && supervisorSigned;

  const handleSignClick = (type: "guard" | "supervisor") => {
    setSignerType(type);
    setShowSignDialog(true);
  };

  const handleConfirmSign = async () => {
    if (!signerType) return;

    setIsSigning(true);
    setShowSignDialog(false);

    try {
      // Get IP address (optional - you could implement this with an API call)
      const ipAddress = undefined; // or fetch from API

      const result = await signIncidentReport({
        reportId: report.id,
        signerType,
        ipAddress,
      });

      if (result.ok) {
        toast.success(
          `You have successfully signed this incident report as ${signerType}.`
        );
        onSignatureComplete?.();
      } else {
        toast.error(result.message || "Failed to sign report");
      }
    } catch (error) {
      console.error("Error signing report:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSigning(false);
      setSignerType(null);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      // Generate PDF blob
      const blob = await pdf(<IncidentReportPDF report={report} />).toBlob();

      // Save file
      const filename = `incident-report-${report.incidentNumber}.pdf`;
      saveAs(blob, filename);

      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Incident Report {report.incidentNumber}
              </CardTitle>
              <CardDescription>
                Generated{" "}
                {format(report.generatedAt, "MMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>

            {allSigned ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Fully Signed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pending Signatures
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Report Details */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Log Title
              </h4>
              <p className="text-sm">{report.log.title}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Location
              </h4>
              <p className="text-sm">{report.log.location.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Incident Date
              </h4>
              <p className="text-sm">
                {report.log.incidentTime
                  ? format(report.log.incidentTime, "MMMM d, yyyy 'at' h:mm a")
                  : format(report.log.createdAt, "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Signature Status */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Signature Status</h4>

            {/* Guard Signature */}
            {report.guardAssignedId && (
              <div className="flex items-start justify-between border rounded-lg p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {guardSigned ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                    <span className="font-medium">Guard Signature</span>
                  </div>

                  {guardSigned ? (
                    <div className="text-sm text-muted-foreground ml-7">
                      <p>Signed by: {report.guardSignedByName}</p>
                      <p>
                        Date:{" "}
                        {format(
                          report.guardSignedAt!,
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground ml-7">
                      Awaiting signature
                    </p>
                  )}
                </div>

                {canSignAsGuard && (
                  <Button
                    size="sm"
                    onClick={() => handleSignClick("guard")}
                    disabled={isSigning}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign Report
                  </Button>
                )}
              </div>
            )}

            {/* Supervisor Signature */}
            <div className="flex items-start justify-between border rounded-lg p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {supervisorSigned ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="font-medium">Supervisor Signature</span>
                </div>

                {supervisorSigned ? (
                  <div className="text-sm text-muted-foreground ml-7">
                    <p>Signed by: {report.supervisorSignedByName}</p>
                    <p>
                      Date:{" "}
                      {format(
                        report.supervisorSignedAt!,
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground ml-7">
                    Awaiting signature
                  </p>
                )}
              </div>

              {canSignAsSupervisor && (
                <Button
                  size="sm"
                  onClick={() => handleSignClick("supervisor")}
                  disabled={isSigning}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Report
                </Button>
              )}
            </div>
          </div>

          {/* Action required alert */}
          {(canSignAsGuard || canSignAsSupervisor) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your signature is required on this incident report. Please
                review the report details and sign when ready.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
        </CardFooter>
      </Card>

      {/* Signature Confirmation Dialog */}
      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Digital Signature</AlertDialogTitle>
            <AlertDialogDescription>
              By signing this incident report, you confirm that the information
              is accurate and complete to the best of your knowledge. Your
              signature will be timestamped and cannot be removed once applied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSign}>
              Confirm & Sign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
