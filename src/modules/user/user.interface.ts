import { Model } from "mongoose";

export interface IUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  user_name: string;
  email: string;
  password: string;
  address?: string;
  role: "teacher" | "student" | "admin";
  profileImage?: string;
  phoneNumber?: string;
  otp?: string;
  expiresAt?: Date;
  isVerified?: boolean;
  isLicenseAvailable?: boolean;
  passwordChangedAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
}
