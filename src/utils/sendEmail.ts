/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import config from "../config";
export const sendEmail = async (to: string, subject: string, html: any) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checkEmail = regex.test(to);
  if (!checkEmail) {
    return {
      success: false,
      message: "Invalid email format.",
    };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.Nodemailer_GMAIL,
        pass: config.Nodemailer_GMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `${config.Nodemailer_GMAIL}`,
      to,
      subject,
      text: "",
      html,
    });
    console.log("Message sent:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
  }
};

export const sendPdfEmail = async (
  to: string,
  subject: string,
  pdfBuffer: unknown // This will be a Blob from the PDF generator
): Promise<{ success: boolean; message: string }> => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checkEmail = regex.test(to);
  if (!checkEmail) {
    return {
      success: false,
      message: "Invalid email format.",
    };
  }

  try {
    let buffer: Buffer;

    if (pdfBuffer instanceof Blob) {
      // Convert Blob to ArrayBuffer, then to Buffer
      const arrayBuffer = await pdfBuffer.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log(buffer);
    } else if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
      console.log(buffer);
    } else {
      throw new Error("Invalid PDF data type. Expected Blob or Buffer.");
    }

    // Create the transporter using Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.Nodemailer_GMAIL,
        pass: config.Nodemailer_GMAIL_PASSWORD,
      },
    });

    // Send the email with the PDF as an attachment
    const info = await transporter.sendMail({
      from: config.Nodemailer_GMAIL,
      to,
      subject,
      text: "Please find your trip permission slip attached.",
      attachments: [
        {
          filename: "trip_permission_slip.pdf",
          content: buffer, // Now properly converted Buffer
          contentType: "application/pdf",
        },
      ],
    });

    console.log("Message sent:", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, message: error.message || "Email sending failed" };
  }
};

interface ContactPayload {
  name: string;
  schoolName: string;
  phoneNumber: string;
  userEmail: string;
  message: string;
  toEmail: string; // enquiries/support email
}

export const sendContactEmail = async (data: ContactPayload) => {
  const { name, schoolName, phoneNumber, userEmail, message, toEmail } = data;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(toEmail)) {
    return {
      success: false,
      message: "Invalid destination email format.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.Nodemailer_GMAIL,
        pass: config.Nodemailer_GMAIL_PASSWORD,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial; padding: 10px;">
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>School Name:</strong> ${schoolName}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: config.Nodemailer_GMAIL,
      to: toEmail,
      subject: "New Support/Enquiry Message",
      html: htmlContent,
    });

    console.log("Message sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};
