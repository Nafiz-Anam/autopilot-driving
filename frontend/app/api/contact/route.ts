import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdminNotification } from "@/lib/email";
import { contactSchema } from "@/lib/validations/contact.schema";

// Simple in-memory rate limiting: 3 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 3) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone, postcode, enquiryType, callTime, message } = parsed.data;

    const submission = await prisma.contactSubmission.create({
      data: { name, phone, postcode, enquiryType, callTime, message },
    });

    // Send admin notification (non-blocking)
    sendAdminNotification(
      `New Contact Form Submission — ${enquiryType}`,
      `Name: ${name}\nPhone: ${phone}\nPostcode: ${postcode}\nEnquiry: ${enquiryType}\nBest time: ${callTime ?? "any"}\nMessage: ${message ?? "none"}`
    ).catch(console.error);

    return NextResponse.json({ success: true, data: { id: submission.id } });
  } catch (err) {
    console.error("[contact] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
