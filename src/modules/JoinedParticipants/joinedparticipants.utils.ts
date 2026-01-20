/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";

export function generateTripPermissionPdf(tripData: any): Promise<Blob> {
  return new Promise((resolve) => {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let yPosition = margin;

    const drawHeaderBox = (
      text: string,
      y: number,
      color: [number, number, number],
    ) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, y, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin + 3, y + 6);
      doc.setTextColor(0, 0, 0);
      return y + 8;
    };

    const drawDivider = (y: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      return y + 3;
    };

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 98, 255);
    const title = "TRIP PERMISSION SLIP";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition + 8);
    yPosition += 15;

    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(1);
    doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
    yPosition += 8;

    yPosition = drawHeaderBox("TRIP INFORMATION", yPosition, [41, 98, 255]);
    yPosition += 4;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Format date and time using the ISO dates directly
    const formattedDate = new Date(tripData.trip_date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const formattedStartTime = new Date(tripData.trip_time).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    );

    const formattedEndTime = new Date(tripData.end_time).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    );

    const tripInfo = [
      ["Trip Name:", tripData.trip_name],
      ["Date:", formattedDate],
      ["Time:", `${formattedStartTime} - ${formattedEndTime}`],
      ["Trip Code:", tripData.code],
      ["Status:", tripData.status.toUpperCase()],
    ];

    tripInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 3, yPosition);
      doc.setFont("helvetica", "normal");

      const maxWidth = contentWidth - 35;
      const lines = doc.splitTextToSize(value, maxWidth);
      doc.text(lines, margin + 30, yPosition);
      yPosition += lines.length * 4;
    });

    yPosition += 5;
    yPosition = drawDivider(yPosition);

    yPosition += 5;
    yPosition = drawDivider(yPosition);

    yPosition = drawHeaderBox("CREATED BY", yPosition, [147, 51, 234]);
    yPosition += 4;

    const creatorInfo = [
      ["Name:", tripData.createdBy.name],
      ["Role:", tripData.createdBy.role],
      ["Email:", tripData.createdBy.email],
      ["Phone:", tripData.createdBy.phoneNumber],
      ["Address:", tripData.createdBy.address],
    ];

    doc.setFontSize(9);
    creatorInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 3, yPosition);
      doc.setFont("helvetica", "normal");

      const maxWidth = contentWidth - 35;
      const lines = doc.splitTextToSize(value, maxWidth);
      doc.text(lines, margin + 30, yPosition);
      yPosition += lines.length * 4;
    });

    yPosition += 8;
    yPosition = drawDivider(yPosition);

    // Add signature section right after creator info
    yPosition += 8;

    const signatureX = pageWidth - margin - 60;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Teacher's Signature:", signatureX, yPosition);

    // Draw signature line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(signatureX, yPosition + 10, signatureX + 50, yPosition + 10);

    // Add date line below signature
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Date: _______________", signatureX, yPosition + 18);

    yPosition += 25;

    // Generated date at bottom left
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${currentDate}`, margin + 3, pageHeight - 10);

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2 - 10,
          pageHeight - 8,
        );
      }
    }

    const pdfBlob = doc.output("blob");
    resolve(pdfBlob);
  });
}
