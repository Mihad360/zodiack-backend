import { z } from "zod";

export const tripValidationSchema = z.object({
  body: z.object({
    createdBy: z
      .string()
      .email("Invalid email address")
      .min(1, "Creator email is required").optional(),
    trip_name: z.string().min(1, "Trip name is required"),
    trip_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
      message: "Invalid date format",
    }),
    trip_time: z.string(),
    end_time: z.string(),
    location: z.string(),
    status: z
      .enum(["planned", "ongoing", "completed", "cancelled"])
      .default("planned").optional(),
    code: z.string().optional(),
    isDeleted: z.boolean().default(false),
  }),
});
