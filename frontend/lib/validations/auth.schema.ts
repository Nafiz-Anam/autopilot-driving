import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z
    .string()
    .regex(/^(\+44|0)7\d{9}$/, "Enter a valid UK mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["STUDENT", "INSTRUCTOR"]).default("STUDENT"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormInput = z.input<typeof registerSchema>;
