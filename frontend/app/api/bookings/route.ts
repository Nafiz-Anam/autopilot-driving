import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations/booking.schema";
import { generateBookingReference } from "@/lib/utils";
import { resolvePackageForBooking } from "@/lib/lesson-pricing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { studentId: session.user.id },
      include: {
        instructor: {
          include: {
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: bookings.map((b: any) => ({
        id: b.id,
        reference: b.reference,
        lessonType: b.lessonType,
        transmission: b.transmission,
        scheduledAt: b.scheduledAt.toISOString(),
        durationMins: b.durationMins,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: Number(b.totalAmount),
        instructor: {
          user: b.instructor.user,
          rating: b.instructor.rating,
          areas: b.instructor.areas,
        },
      })),
    });
  } catch (err) {
    console.error("[bookings GET] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      lessonType,
      transmission: bodyTransmission,
      instructorId,
      scheduledAt,
      durationMins,
      packageId,
      voucherCode,
      couponCode,
      notes,
    } = parsed.data;

    const resolved = await resolvePackageForBooking(lessonType, packageId);
    if (!resolved) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive package for this lesson type" },
        { status: 400 }
      );
    }

    const transmission =
      lessonType === "MANUAL"
        ? "manual"
        : lessonType === "AUTOMATIC"
          ? "automatic"
          : bodyTransmission;

    const reference = generateBookingReference();

    const booking = await prisma.booking.create({
      data: {
        reference,
        studentId: session.user.id,
        instructorId,
        lessonType,
        transmission,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        status: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount: resolved.totalAmount,
        pricingPackageId: resolved.package.id,
        voucherCode,
        couponCode,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (err) {
    console.error("[bookings POST] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
