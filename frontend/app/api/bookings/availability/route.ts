import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, parseISO, format, startOfDay } from "date-fns";

const ALL_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

// day of week: 0=Sunday, 1=Monday ... 6=Saturday
function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get("instructorId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!instructorId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: "instructorId, startDate, endDate required" },
        { status: 400 }
      );
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    // Fetch instructor availability patterns
    const availabilityPatterns = await prisma.availability.findMany({
      where: { instructorId, isAvailable: true },
    });

    // Fetch existing confirmed bookings in range
    const existingBookings = await prisma.booking.findMany({
      where: {
        instructorId,
        scheduledAt: {
          gte: startDate,
          lte: addDays(endDate, 1),
        },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { scheduledAt: true, durationMins: true },
    });

    // Build a Set of booked slot strings: "YYYY-MM-DD HH:mm"
    const bookedSlots = new Set<string>();
    for (const booking of existingBookings) {
      const dateStr = format(booking.scheduledAt, "yyyy-MM-dd");
      const timeStr = format(booking.scheduledAt, "HH:mm");
      bookedSlots.add(`${dateStr} ${timeStr}`);
    }

    const result: { date: string; slots: string[] }[] = [];
    let current = startOfDay(startDate);

    while (current <= endDate) {
      const dayOfWeek = getDayOfWeek(current);
      const dateStr = format(current, "yyyy-MM-dd");

      // Check if instructor works this day
      const pattern = availabilityPatterns.find((p: { dayOfWeek: number }) => p.dayOfWeek === dayOfWeek);

      if (pattern) {
        const availableSlots = ALL_SLOTS.filter((slot) => {
          return !bookedSlots.has(`${dateStr} ${slot}`);
        });
        result.push({ date: dateStr, slots: availableSlots });
      } else {
        result.push({ date: dateStr, slots: [] });
      }

      current = addDays(current, 1);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[availability] error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
