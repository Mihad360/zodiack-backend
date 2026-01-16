/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ISupport } from "./support.interface";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import supportModel from "./support.model";
import config from "../../config";

const sendSupport = async (payload: ISupport, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  payload.user = new Types.ObjectId(isUserExist._id);
  const result = await supportModel.create(payload);
  return result;
};

const getSupports = async () => {
  const result = await supportModel.find({ createdAt: -1 }).populate({
    path: "user",
    select: "name fatherName motherName email role profileImage",
  });
  return result;
};

interface ContactData {
  name: string;
  schoolName: string;
  phoneNumber: string;
  userEmail: string;
  message: string;
  type: "enquiry" | "support" | "sale"; // two types
}

const sendContactSupport = async (data: ContactData) => {
  console.log(data);
  if (!data) {
    throw new AppError(HttpStatus.NOT_FOUND, "Data not found");
  }
  const { name, schoolName, phoneNumber, userEmail, message, type } = data;
  // Pick correct email based on type
  const toEmail =
    type === "support"
      ? // ? "ahmedmihad962@gmail.com"
        "Support@groupmate.com.au"
      : type === "enquiry" // support page
        ? "Enquiry@groupmate.com.au"
        : "Sales@groupmate.com.au"; // main page

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
        <h3>New ${type === "support" ? "Support" : type === "enquiry" ? "Enquiry" : "Sales"} Message</h3>

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
      subject:
        type === "support"
          ? "New Support Request"
          : type === "enquiry"
            ? "New Enquiry Message"
            : "New Sales Message",
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const supportServices = {
  sendSupport,
  getSupports,
  sendContactSupport,
};
