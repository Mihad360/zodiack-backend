import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

export const verificationEmailTemplate = (name: string, otp: string) => {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>Email Verification</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Use the following verification code to complete your signup:</p>
      <h1 style="color: #4CAF50;">${otp}</h1>
      <p>This code will expire in <b>5 minutes</b>.</p>
    </div>
  `;
};

export const checkOtp = async (email: string, otp: string) => {
  const otpUser = await UserModel.findOne({ email: email });
  console.log(otpUser?.otp);
  if (otpUser && otpUser?.otp !== otp) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The otp is invalid!");
  }
  const updateUser = await UserModel.findOneAndUpdate(
    { email: email },
    {
      otp: null,
      expiresAt: null,
      isVerified: true,
    },
    { new: true }
  );
  return updateUser;
};
