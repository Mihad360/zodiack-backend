/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";

// interface Participant {
//   firstName: string;
//   lastName: string;
//   role: string;
// }

// interface TripData {
//   trip_name: string;
//   trip_date: string;
//   trip_time: string;
//   end_time: string;
//   location: string;
//   code: string;
//   status: string;
//   participants: Participant[];
//   createdBy: {
//     user_name: string;
//     email: string;
//     phoneNumber: string;
//     address: string;
//     role: string;
//   };
// }

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

    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 15) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    const drawHeaderBox = (
      text: string,
      y: number,
      color: [number, number, number]
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

    const tripInfo = [
      ["Trip Name:", tripData.trip_name],
      [
        "Date:",
        new Date(tripData.trip_date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      ],
      ["Time:", `${tripData.trip_time} - ${tripData.end_time}`],
      ["Location:", tripData.location],
      ["Trip Code:", tripData.code],
      ["Status:", tripData.status],
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

    yPosition = drawHeaderBox("PARTICIPANTS", yPosition, [34, 197, 94]);
    yPosition += 4;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Total: " + tripData.participants.length, margin + 3, yPosition);
    yPosition += 6;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPosition, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.text("#", margin + 2, yPosition + 4);
    doc.text("Name", margin + 12, yPosition + 4);
    doc.text("Role", margin + 70, yPosition + 4);
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    tripData.participants.forEach((participant: any, index: number) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, yPosition - 1, contentWidth, 4, "F");
      }

      doc.text((index + 1).toString(), margin + 2, yPosition + 2);
      doc.text(
        `${participant.firstName} ${participant.lastName}`,
        margin + 12,
        yPosition + 2
      );
      doc.text(participant.role, margin + 70, yPosition + 2);
      yPosition += 4;
    });

    yPosition += 5;
    yPosition = drawDivider(yPosition);

    yPosition = drawHeaderBox("CREATED BY", yPosition, [147, 51, 234]);
    yPosition += 4;

    const creatorInfo = [
      ["Name:", tripData.createdBy.user_name],
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

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${currentDate}`, margin + 3, yPosition);

    const totalPages = doc.getNumberOfPages();
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 15,
          pageHeight - 8
        );
      }
    }

    const pdfBlob = doc.output("blob");
    resolve(pdfBlob);
  });
}
