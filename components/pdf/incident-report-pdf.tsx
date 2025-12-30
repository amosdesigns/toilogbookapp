import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import type { IncidentReportWithDetails } from "@/lib/actions/incident-report-generation-actions";

// Define styles matching Town of Islip format
const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    padding: 72, // 1 inch margins (72 points = 1 inch)
    lineHeight: 1.15,
  },

  // Header styles
  headerBlock: {
    marginBottom: 12,
  },
  incidentMeta: {
    fontSize: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 12,
  },

  // Info block
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 10,
  },
  infoLabel: {
    width: "40%",
    fontFamily: "Times-Bold",
  },
  infoValue: {
    width: "60%",
  },

  // Section styles
  section: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    marginBottom: 8,
    borderBottom: "1 solid black",
    paddingBottom: 4,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.15,
    textAlign: "justify",
  },
  paragraph: {
    marginBottom: 6,
  },

  // Signature styles
  signatureSection: {
    marginTop: 24,
  },
  signatureBlock: {
    marginTop: 16,
  },
  signatureLine: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  signatureLabel: {
    fontFamily: "Times-Bold",
    marginRight: 8,
  },
  signatureUnderline: {
    flex: 1,
    borderBottom: "1 solid black",
    marginLeft: 8,
    paddingBottom: 2,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: "Times-Italic",
  },
  signatureDate: {
    fontSize: 10,
    marginTop: 4,
  },

  // Separator
  separator: {
    borderBottom: "1 solid black",
    marginVertical: 12,
  },

  // Digital signature info
  digitalSignature: {
    fontSize: 9,
    fontFamily: "Times-Italic",
    color: "#666",
    marginTop: 4,
  },
});

interface IncidentReportPDFProps {
  report: IncidentReportWithDetails;
}

export function IncidentReportPDF({ report }: IncidentReportPDFProps) {
  const { log } = report;

  // Format dates
  const reportDate = format(report.generatedAt, "MMMM d, yyyy");
  const incidentDate = log.incidentTime
    ? format(log.incidentTime, "MMMM d, yyyy")
    : format(log.createdAt, "MMMM d, yyyy");

  const incidentTime = log.incidentTime
    ? format(log.incidentTime, "h:mm a")
    : format(log.createdAt, "h:mm a");

  // Split description into paragraphs
  const descriptionParagraphs =
    log.description?.split("\n").filter((p) => p.trim()) || [];

  // Split actions taken into paragraphs
  const actionsParagraphs =
    log.actionsTaken?.split("\n").filter((p) => p.trim()) || [];

  // Follow-up text
  const followUpText = log.followUpRequired
    ? log.followUpNotes || "Follow-up action required."
    : "No follow-up action required.";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with incident number and time */}
        <View style={styles.incidentMeta}>
          <Text>Incident # {report.incidentNumber}</Text>
          <Text>Time: {incidentTime}</Text>
        </View>

        {/* Logo - TOI Logo would go here */}
        {/* <Image style={styles.logo} src="/images/toilogo.png" /> */}

        {/* Title */}
        <Text style={styles.title}>Public Safety Enforcement</Text>
        <Text style={styles.subtitle}>Marina Incident Report</Text>

        <View style={styles.separator} />

        {/* Report Information Block */}
        <View style={styles.headerBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Report Date:</Text>
            <Text style={styles.infoValue}>{reportDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{log.location.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Incident Date:</Text>
            <Text style={styles.infoValue}>{incidentDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marina Guard on Duty:</Text>
            <Text style={styles.infoValue}>
              {log.user.firstName} {log.user.lastName}
            </Text>
          </View>

          {log.severity && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Severity:</Text>
              <Text style={styles.infoValue}>{log.severity}</Text>
            </View>
          )}
        </View>

        <View style={styles.separator} />

        {/* Incident Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Incident: (Briefly describe what happened)
          </Text>

          <View style={styles.sectionContent}>
            {/* Title */}
            {log.title && (
              <Text style={[styles.paragraph, { fontFamily: "Times-Bold" }]}>
                {log.title}
              </Text>
            )}

            {/* Description paragraphs */}
            {descriptionParagraphs.map((paragraph: string, index: number) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}

            {/* People involved */}
            {log.peopleInvolved && (
              <Text style={styles.paragraph}>
                People Involved: {log.peopleInvolved}
              </Text>
            )}

            {/* Witnesses */}
            {log.witnesses && (
              <Text style={styles.paragraph}>Witnesses: {log.witnesses}</Text>
            )}

            {/* Weather conditions */}
            {log.weatherConditions && (
              <Text style={styles.paragraph}>
                Weather Conditions: {log.weatherConditions}
              </Text>
            )}
          </View>
        </View>

        {/* Actions Taken Section */}
        {log.actionsTaken && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Actions Taken</Text>

            <View style={styles.sectionContent}>
              {actionsParagraphs.map((paragraph: string, index: number) => (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Follow Up Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Follow Up</Text>

          <View style={styles.sectionContent}>
            <Text style={styles.paragraph}>{followUpText}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          {/* Guard Signature */}
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Signature Marina Guard:</Text>
              <View style={styles.signatureUnderline}>
                {report.guardSignedByName && (
                  <Text style={styles.signatureText}>
                    {report.guardSignedByName}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.signatureDate}>
              <Text>
                Date:{" "}
                {report.guardSignedAt
                  ? format(report.guardSignedAt, "MMMM d, yyyy")
                  : "______________"}
              </Text>
            </View>

            {report.guardSignedAt && (
              <Text style={styles.digitalSignature}>
                Digitally signed on{" "}
                {format(report.guardSignedAt, "MMMM d, yyyy 'at' h:mm a")}
              </Text>
            )}
          </View>

          {/* Supervisor Signature */}
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Signature Supervisor:</Text>
              <View style={styles.signatureUnderline}>
                {report.supervisorSignedByName && (
                  <Text style={styles.signatureText}>
                    {report.supervisorSignedByName}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.signatureDate}>
              <Text>
                Date:{" "}
                {report.supervisorSignedAt
                  ? format(report.supervisorSignedAt, "MMMM d, yyyy")
                  : "______________"}
              </Text>
            </View>

            {report.supervisorSignedAt && (
              <Text style={styles.digitalSignature}>
                Digitally signed on{" "}
                {format(report.supervisorSignedAt, "MMMM d, yyyy 'at' h:mm a")}
              </Text>
            )}
          </View>
        </View>

        {/* Footer - Report Number */}
        <View style={{ position: "absolute", bottom: 36, left: 72, right: 72 }}>
          <Text style={{ fontSize: 8, textAlign: "center", color: "#666" }}>
            Report Number: {report.incidentNumber} | Generated:{" "}
            {format(report.generatedAt, "MMM d, yyyy h:mm a")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
