import { z } from "zod";

export const giftVoucherSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(10, "Minimum £10"),
  senderName: z.string().min(2, "Sender name required"),
  recipientName: z.string().min(2, "Recipient name required"),
  recipientEmail: z.string().email("Valid email required"),
  message: z.string().max(200, "Message max 200 characters").optional(),
});

export const validateVoucherSchema = z.object({
  code: z.string().min(1, "Code required"),
  amount: z.number().positive(),
});

export type GiftVoucherInput = z.infer<typeof giftVoucherSchema>;
export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>;
