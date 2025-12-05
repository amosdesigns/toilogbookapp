"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertCircle } from "lucide-react";
import { generateIncidentReport } from "@/lib/actions/incident-report-generation-actions";
import { toast } from "sonner";

// Validation schema
const generateReportSchema = z.object({
  logId: z.string(),
  guardAssignedId: z.string().optional(),
  supervisorAssignedId: z.string().min(1, "Supervisor assignment is required"),
  notifiedUserIds: z.array(z.string()),
});

type GenerateReportFormData = z.infer<typeof generateReportSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface GenerateIncidentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logId: string;
  logTitle: string;
  guards: User[];
  supervisors: User[];
  onSuccess?: (reportId: string) => void;
}

export function GenerateIncidentReportDialog({
  open,
  onOpenChange,
  logId,
  logTitle,
  guards,
  supervisors,
  onSuccess,
}: GenerateIncidentReportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      logId,
      guardAssignedId: undefined,
      supervisorAssignedId: "",
      notifiedUserIds: [],
    },
  });

  const handleSubmit = async (data: GenerateReportFormData) => {
    setIsSubmitting(true);

    try {
      const result = await generateIncidentReport({
        logId: data.logId,
        guardAssignedId: data.guardAssignedId,
        supervisorAssignedId: data.supervisorAssignedId,
        notifiedUserIds: data.notifiedUserIds,
      });

      if (result.ok && result.data) {
        toast.success("Report Generated", {
          description:
            result.message ||
            `Incident report ${result.data.incidentNumber} has been created.`,
        });

        onOpenChange(false);
        form.reset();
        onSuccess?.(result.data.id);
      } else {
        toast.error("Error", {
          description: result.message || "Failed to generate incident report",
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Incident Report
          </DialogTitle>
          <DialogDescription>
            Create an official incident report for: <strong>{logTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will create a formal incident report with a unique incident
            number. Assigned personnel will be notified and can sign the report
            digitally.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Guard Assignment (Optional) */}
            <FormField
              control={form.control}
              name="guardAssignedId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Guard (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guard to sign report" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No guard assigned</SelectItem>
                      {guards.map((guard) => (
                        <SelectItem key={guard.id} value={guard.id}>
                          {guard.firstName} {guard.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a guard who will sign this report (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supervisor Assignment (Required) */}
            <FormField
              control={form.control}
              name="supervisorAssignedId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Supervisor *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervisor to sign report" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.firstName} {supervisor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a supervisor who will sign this report (required)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notify Other Supervisors */}
            <FormField
              control={form.control}
              name="notifiedUserIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Notify Other Supervisors</FormLabel>
                    <FormDescription>
                      Select other supervisors to be notified about this report
                    </FormDescription>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {supervisors.map((supervisor) => (
                      <FormField
                        key={supervisor.id}
                        control={form.control}
                        name="notifiedUserIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={supervisor.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(supervisor.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          supervisor.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== supervisor.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {supervisor.firstName} {supervisor.lastName}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
