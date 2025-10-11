/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model } from "mongoose";

export interface IUser {
  _id?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  email: string;
  password: string;
  address?: string;
  role: "teacher" | "student" | "admin" | "participant";
  profileImage?: string;
  phoneNumber?: string;
  isActive?: boolean;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  licenseExpiresAt?: Date;
  isLicenseAvailable?: boolean;
  passwordChangedAt?: Date;
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
