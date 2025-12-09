# Incident Report PDF Template Specification

## Overview
Complete specification for generating the "Public Safety Enforcement Marina Incident Report" PDF document with proper formatting, spacing, and signature lines.

## Document Layout

### Page Setup
- **Paper Size**: Letter (8.5" × 11")
- **Orientation**: Portrait
- **Margins**: 1 inch all sides (top, bottom, left, right)
- **Font**: Times New Roman (or similar serif font)
- **Font Sizes**:
  - Title: 16pt bold
  - Section Headers: 12pt bold
  - Field Labels: 10pt
  - Field Values: 10pt regular
  - Body Text: 10pt regular

### Complete Template Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Incident # __________ Time: __________                     │
│                                                              │
│         Public Safety Enforcement                           │
│            Marina Incident Report                           │
│                                                              │
│  Report Date: [Date]                                        │
│  Location: [Marina Name]        Incident Date: [Date]       │
│  Marina Guard on Duty: [Name]   Supervisor on Duty: [Name]  │
│  Who Was Notified: __________________________________        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Incident: (Briefly describe what happened)                 │
│  ──────────────────────────────────────────                 │
│                                                              │
│  [Multiple paragraphs of incident description]              │
│  [Proper line spacing between paragraphs]                   │
│  [Text wraps naturally to margins]                          │
│  [Minimum 1/2 page space allocated]                         │
│                                                              │
│  [PAGE BREAK IF NEEDED]                                     │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Actions Taken                                              │
│  ──────────────────                                         │
│                                                              │
│  [Multiple paragraphs describing actions]                   │
│  [Proper line spacing]                                      │
│  [Minimum 1/3 page space allocated]                         │
│                                                              │
│  [PAGE BREAK IF NEEDED]                                     │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Follow Up                                                  │
│  ──────────────                                             │
│                                                              │
│  [Follow-up information]                                    │
│  [Proper line spacing]                                      │
│  [Minimum 1/4 page space]                                   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  [ENSURE SIGNATURES ARE ON SAME PAGE IF POSSIBLE]           │
│                                                              │
│  Signature Marina Guard: _______________________________    │
│                                                              │
│  Date: ______________                                       │
│                                                              │
│                                                              │
│  Signature Supervisor: __________________________________    │
│                                                              │
│  Date: ______________                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Detailed Section Specifications

### Header Section (Top of Page 1)

**Incident Number & Time**
- Position: Top left, 0.5" from top margin
- Format: "Incident # __________ Time: __________"
- Underline length: 15 characters each
- Font: 10pt regular

**Title**
- Position: Centered, 1" from top
- Text: "Public Safety Enforcement Marina Incident Report"
- Font: 16pt bold
- Line spacing: 1.5

**Report Information Block**
- Position: Below title, left-aligned
- Spacing: Single-spaced within block, double-space after
- Format:
  ```
  Report Date: August 21, 2025
  Location: East Islip Marina            Incident Date: August 2, 2025
  Marina Guard on Duty: Jerome Amos      Supervisor on Duty: Martillo
  Who Was Notified: _______________________________
  ```

### Incident Section

**Header**
- Text: "Incident: (Briefly describe what happened)"
- Font: 12pt bold
- Underline: Full width thin line below
- Spacing: Double-space before, single-space after

**Content**
- Font: 10pt regular, Times New Roman
- Line spacing: 1.15 (slightly more than single-spaced)
- Paragraph spacing: 6pt between paragraphs
- Text justification: Left-aligned
- Indentation: None (flush left)
- Minimum space: 3 inches (about half page)
- Maximum: Continue to next page if needed

**Formatting Rules**:
- First sentence should include date and time: "On [Day], [Date], at approximately [time]..."
- Natural paragraph breaks
- Preserve line breaks from form input
- No bullet points or numbering
- Narrative format

### Actions Taken Section

**Header**
- Text: "Actions Taken"
- Font: 12pt bold
- No underline style text, just bold
- Spacing: Double-space before section, single-space after header

**Content**
- Font: 10pt regular, Times New Roman
- Line spacing: 1.15
- Paragraph spacing: 6pt between paragraphs
- Text justification: Left-aligned
- Minimum space: 2 inches (about 1/3 page)
- Maximum: Continue to next page if needed

**Formatting Rules**:
- Describe what the guard did
- Who was contacted
- Instructions received
- Steps taken
- Natural paragraph format

### Follow Up Section

**Header**
- Text: "Follow Up"
- Font: 12pt bold
- Spacing: Double-space before, single-space after

**Content**
- Font: 10pt regular, Times New Roman
- Line spacing: 1.15
- Paragraph spacing: 6pt between paragraphs
- Minimum space: 1.5 inches (about 1/4 page)

### Signature Section

**Positioning**:
- Should appear on last page
- Minimum 2.5 inches from bottom of page
- If not enough space on current page, create new page
- Try to keep both signatures on same page

**Marina Guard Signature**
- Label: "Signature Marina Guard:"
- Underline: 3.5 inches long
- Date field: "Date: ______________" (right-aligned or on next line)
- Spacing: 2 blank lines after

**Supervisor Signature**
- Label: "Signature Supervisor:"
- Underline: 3.5 inches long
- Date field: "Date: ______________"
- Position: 1 inch below guard signature

**Format**:
```
Signature Marina Guard: ____________________________________________

Date: ______________


Signature Supervisor: _______________________________________________

Date: ______________
```

## Spacing & Pagination Rules

### Page Breaks
1. **Never break mid-paragraph** - Complete paragraph must stay together
2. **Keep signatures together** - Both signatures should be on same page if possible
3. **Section headers with content** - Don't leave section header orphaned at bottom of page
4. **Minimum content per section** - Each section should have minimum allocated space before breaking

### Paragraph Spacing
- **Within paragraphs**: 1.15 line spacing
- **Between paragraphs**: 6pt (about half a blank line)
- **Before section headers**: 12pt (about 1 blank line)
- **After section headers**: 6pt

### Text Wrapping
- **Automatic word wrap** at margin
- **No hyphenation** - words wrap to next line whole
- **Preserve manual line breaks** from form input
- **Trim excessive whitespace** - collapse multiple spaces to one

## PDF Generation Implementation

### Using jsPDF

```typescript
import jsPDF from 'jspdf'

function generateIncidentReportPDF(data: IncidentReportFormData): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  })

  // Set margins
  const margin = 1
  const pageWidth = 8.5
  const pageHeight = 11
  const contentWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Header
  doc.setFontSize(10)
  doc.text(`Incident # ${data.incidentNumber}     Time: ${data.incidentTime}`, margin, yPosition)
  yPosition += 0.5

  // Title
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text('Public Safety Enforcement', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 0.25
  doc.text('Marina Incident Report', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 0.5

  // Report info block
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  doc.text(`Report Date: ${data.reportDate}`, margin, yPosition)
  yPosition += 0.2
  doc.text(`Location: ${data.location}`, margin, yPosition)
  doc.text(`Incident Date: ${data.incidentDate}`, margin + 3.5, yPosition)
  yPosition += 0.2
  doc.text(`Marina Guard on Duty: ${data.guardOnDuty}`, margin, yPosition)
  doc.text(`Supervisor on Duty: ${data.supervisorOnDuty}`, margin + 3.5, yPosition)
  yPosition += 0.2
  doc.text(`Who Was Notified: ${data.whoWasNotified || '______________________________'}`, margin, yPosition)
  yPosition += 0.4

  // Line separator
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 0.3

  // Incident section
  doc.setFont('times', 'bold')
  doc.text('Incident: (Briefly describe what happened)', margin, yPosition)
  yPosition += 0.1
  doc.line(margin, yPosition, margin + 3, yPosition)
  yPosition += 0.2

  // Incident description (with text wrapping)
  doc.setFont('times', 'normal')
  const incidentLines = doc.splitTextToSize(data.incidentDescription, contentWidth)
  doc.text(incidentLines, margin, yPosition)
  yPosition += (incidentLines.length * 0.15) + 0.3

  // Check if need new page
  if (yPosition > pageHeight - 3) {
    doc.addPage()
    yPosition = margin
  }

  // Actions Taken section
  doc.setFont('times', 'bold')
  doc.text('Actions Taken', margin, yPosition)
  yPosition += 0.2

  doc.setFont('times', 'normal')
  const actionsLines = doc.splitTextToSize(data.actionsTaken, contentWidth)
  doc.text(actionsLines, margin, yPosition)
  yPosition += (actionsLines.length * 0.15) + 0.3

  // Check if need new page
  if (yPosition > pageHeight - 3) {
    doc.addPage()
    yPosition = margin
  }

  // Follow Up section
  if (data.followUp) {
    doc.setFont('times', 'bold')
    doc.text('Follow Up', margin, yPosition)
    yPosition += 0.2

    doc.setFont('times', 'normal')
    const followUpLines = doc.splitTextToSize(data.followUp, contentWidth)
    doc.text(followUpLines, margin, yPosition)
    yPosition += (followUpLines.length * 0.15) + 0.3
  }

  // Ensure enough space for signatures (2.5 inches needed)
  if (yPosition > pageHeight - 2.5) {
    doc.addPage()
    yPosition = margin
  }

  // Signatures
  yPosition += 0.3
  doc.setFont('times', 'normal')

  // Guard signature
  doc.text('Signature Marina Guard:', margin, yPosition)
  doc.line(margin + 2.3, yPosition, pageWidth - margin, yPosition)
  yPosition += 0.3
  doc.text('Date:', margin, yPosition)
  doc.line(margin + 0.6, yPosition, margin + 2, yPosition)
  yPosition += 0.6

  // Supervisor signature
  doc.text('Signature Supervisor:', margin, yPosition)
  doc.line(margin + 2.3, yPosition, pageWidth - margin, yPosition)
  yPosition += 0.3
  doc.text('Date:', margin, yPosition)
  doc.line(margin + 0.6, yPosition, margin + 2, yPosition)

  return doc.output('blob')
}
```

## Quality Checklist

Before finalizing PDF generation, verify:

- [ ] All sections present and in correct order
- [ ] Proper page margins (1 inch all sides)
- [ ] Professional font (Times New Roman, 10pt body, 12pt headers)
- [ ] Signature lines are proper length (3.5 inches)
- [ ] Date fields are present under each signature
- [ ] No orphaned section headers at page bottom
- [ ] Paragraphs don't break mid-sentence
- [ ] Both signatures on same page when possible
- [ ] Incident # and Time at very top
- [ ] Title is centered and bold
- [ ] Actions Taken section has adequate space
- [ ] Text wraps properly at margins
- [ ] Line spacing is professional (1.15)
- [ ] No excessive whitespace
- [ ] Document looks official and professional

## Example Output Preview

**Page 1:**
```
Incident # INC-2025-001234        Time: 1:02 AM

          Public Safety Enforcement
             Marina Incident Report

Report Date: August 21, 2025
Location: East Islip Marina              Incident Date: August 2, 2025
Marina Guard on Duty: Jerome Amos        Supervisor on Duty: Martillo
Who Was Notified: Town PD, Supervisor Martinez

───────────────────────────────────────────────────────────

Incident: (Briefly describe what happened)
────────────────────────────────────────

On Sunday, August 2nd, at approximately 1:02 AM, a loud argument
was noted by me at the hut coming from someplace inside the park.
After checking out the issue, I returned to find three cars at the
closed gate where an individual, identified as Jim - an owner of
the restaurant, insisted that the gate should be open longer
despite it not being locked.

The both gates was closed but not locked as was the hut. If I need
to leave my post, we are required to do this.

Jim was blocking the gate and communicated using crude language,
threatening physical altercation. I noted the smell of alcohol on
his breath from about 6 or more feet away and reminded him that
drinking and driving was unacceptable. Jim claimed to be one of
the owners and insisted that the gate remain open.

Actions Taken

I reported the incident to my supervisor along with the fact that
earlier in the day, guards mentioned a problem and that the owner
would contact Tom, a public safety officer, regarding the gate.

Upon checking in, I confirmed with Nancy (previous guards'
supervisor) about gate closure times and was informed that I should
close the gate, typically done around 11:30 PM. Following
discussions, she advised me to reopen the gate, which was supposed
to close at 12:00 AM. I received confirmation from supervisor
Martinez to close the gate 10 minutes past midnight, which I
complied with.

During the same day, I was notified about two or three deer in
front of the gate, which I also reported to my supervisor.

Follow Up

It is my understanding that supervisor checked in with the
restaurant staff about this issue to clear up any questions.


Signature Marina Guard: ____________________________________________

Date: ______________


Signature Supervisor: _______________________________________________

Date: ______________
```

## Technical Notes

- Use `splitTextToSize()` for automatic text wrapping
- Check page height before adding new sections
- Add pages only when necessary
- Keep signatures together at bottom
- Save as PDF with proper metadata (title, author, subject)
- Consider adding watermark or footer with page numbers for multi-page reports

## Next Steps for Implementation

1. Install jsPDF: `npm install jspdf @types/jspdf`
2. Create helper function for PDF generation
3. Add download functionality to form dialog
4. Test with various content lengths
5. Verify pagination works correctly
6. Ensure signatures always fit properly
