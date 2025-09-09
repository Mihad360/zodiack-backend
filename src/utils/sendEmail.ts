/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import config from "../config";
export const sendEmail = async (
  to: string,
  subject: string,
  html: any
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
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
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
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, message: error.message || "Email sending failed" };
  }
};

export const sendPdfEmail = async (
  to: string,
  subject: string,
  pdfBuffer: unknown, // This will be a Blob from the PDF generator
): Promise<{ success: boolean; message: string }> => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const checkEmail = regex.test(to)
  if (!checkEmail) {
    return {
      success: false,
      message: "Invalid email format.",
    }
  }

  try {
    let buffer: Buffer

    if (pdfBuffer instanceof Blob) {
      // Convert Blob to ArrayBuffer, then to Buffer
      const arrayBuffer = await pdfBuffer.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer
    } else {
      throw new Error("Invalid PDF data type. Expected Blob or Buffer.")
    }

    // Create the transporter using Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_GMAIL,
        pass: process.env.NODEMAILER_GMAIL_PASSWORD,
      },
    })

    // Send the email with the PDF as an attachment
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_GMAIL,
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
    })

    console.log("Message sent:", info.messageId)
    return { success: true, message: "Email sent successfully" }
  } catch (error: any) {
    console.error("Email sending failed:", error.message)
    return { success: false, message: error.message || "Email sending failed" }
  }
}

