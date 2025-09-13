import { z } from "zod";

export const userZodSchema = z.object({
  body: z.object({
    user_name: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    address: z.string().optional(),
    role: z.enum(["teacher", "student", "admin"]),
    profileImage: z.string().optional(),
    phoneNumber: z.string().optional(),
    otp: z.string().optional(),
    expiresAt: z.date().optional(),
    isVerified: z.boolean().default(false),
    isLicenseAvailable: z.boolean().default(false),
    isDeleted: z.boolean().default(false),
  }),
});
