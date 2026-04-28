import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendAdminNotification } from "@/lib/email";

const applySchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone required"),
  postcode: z.string().min(3, "Postcode required"),
  hasFullLicence: z.boolean(),
  yearsExperience: z.enum(["3-5", "6-10", "10+"]),
  trainingStarted: z.boolean().default(false),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      postcode,
      hasFullLicence,
      yearsExperience,
      trainingStarted,
      message,
    } = parsed.data;

    const application = await prisma.instructorApplication.create({
      data: {
        fullName,
        email,
        phone,
        postcode,
        hasFullLicence,
        yearsExperience,
        trainingStarted,
        message,
        status: "pending",
      },
    });

    sendAdminNotification(
      `New Instructor Application — ${fullName}`,
      `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nPostcode: ${postcode}\nFull Licence: ${hasFullLicence ? "Yes" : "No"}\nExperience: ${yearsExperience} years\nTraining Started: ${trainingStarted ? "Yes" : "No"}\nMessage: ${message ?? "none"}`
    ).catch(console.error);

    return NextResponse.json({ success: true, data: { id: application.id } });
  } catch (err) {
    console.error("[instructors/apply] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
