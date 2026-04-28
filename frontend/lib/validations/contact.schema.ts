import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z
    .string()
    .regex(/^(\+44|0)7\d{9}$/, "Enter a valid UK mobile number"),
  postcode: z.string().min(3, "Postcode required"),
  enquiryType: z.enum([
    "manual_lessons",
    "automatic_lessons",
    "intensive_course",
    "refresher",
    "become_instructor",
    "other",
  ]),
  callTime: z.string().optional(),
  message: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
