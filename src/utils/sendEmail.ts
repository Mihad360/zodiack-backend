/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import config from "../config";
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
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
