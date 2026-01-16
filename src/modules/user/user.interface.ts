/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Types } from "mongoose";

export interface IUser {
  _id?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  email: string;
  password: string;
  address?: string;
  role: "teacher" | "student" | "admin" | "participant" | "school";
  profileImage?: string;
  phoneNumber?: string;
  isActive?: boolean;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  isTripOngoing?: boolean;
  ongoingTripId?: Types.ObjectId | null;
  licenseExpiresAt?: Date;
  isLicenseAvailable?: boolean;
  passwordChangedAt?: Date;
  conversationId?: Types.ObjectId;
  isEmergencyOngoing?: boolean;
  fcmToken: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface User extends Model<IUser> {
  isUserExistByEmail(email: string): Promise<IUser>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  newHashedPassword(newPassword: string): Promise<string>;
  isOldTokenValid: (
    passwordChangedTime: Date,
    jwtIssuedTime: number
  ) => Promise<boolean>;
  isJwtIssuedBeforePasswordChange(
    passwordChangeTimeStamp: Date,
    jwtIssuedTimeStamp: number
  ): boolean;
  isUserExistByCustomId(email: string): Promise<IUser>;
}
