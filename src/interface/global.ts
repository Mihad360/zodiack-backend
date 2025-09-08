import { Types } from "mongoose";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email: string;
  role: string | undefined;
  name?: string;
  profileImage?: string;
  isDeleted?: boolean;
}

export const USER_ROLE = {
  admin: "admin",
  student: "student",
  teacher: "teacher",
} as const;

export type TUserRole = keyof typeof USER_ROLE;
