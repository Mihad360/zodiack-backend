import { Types } from "mongoose";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email?: string;
  role: string | undefined;
  name?: string;
  isLicenseAvailable?: boolean;
  profileImage?: string;
  isDeleted?: boolean;
}

export interface StudentJwtPayload {
  studentId: Types.ObjectId | string;
  firstName: string;
  lastName: string;
  role: string;
}

export const USER_ROLE = {
  admin: "admin",
  student: "student",
  teacher: "teacher",
  participant: "participant",
} as const;

export type TUserRole = keyof typeof USER_ROLE;
