import { z } from "zod";

export const bookingSchema = z.object({
  lessonType: z.enum(["MANUAL", "AUTOMATIC", "INTENSIVE", "REFRESHER", "PASS_PLUS", "THEORY"]),
  transmission: z.enum(["manual", "automatic"]),
  instructorId: z.string().cuid(),
  packageId: z.string(),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().min(60).default(60),
  totalAmount: z.number().positive(),
  voucherCode: z.string().optional(),
  notes: z.string().optional(),
});

export const studentDetailsSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z
    .string()
    .regex(/^(\+44|0)7\d{9}$/, "Enter a valid UK mobile number"),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  provisionalLicence: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type StudentDetailsInput = z.infer<typeof studentDetailsSchema>;
