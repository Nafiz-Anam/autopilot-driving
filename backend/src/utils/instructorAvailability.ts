import prisma from '../client';

export const LONDON_TZ = 'Europe/London';

const CONNECTED_CALENDAR_PROVIDERS = ['google_calendar', 'apple_ics'];

export function formatHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Without a connected calendar there's no busy-block source at all, so the
// full-day baseline would otherwise mean "fully open 24/7" -- treat a
// disconnected instructor as unbookable instead of silently wide open.
export async function hasActiveCalendarConnectionByUserId(userId: string): Promise<boolean> {
  const integration = await prisma.userIntegration.findFirst({
    where: { userId, provider: { in: CONNECTED_CALENDAR_PROVIDERS }, enabled: true },
    select: { id: true },
  });
  return !!integration;
}

export async function hasActiveCalendarConnection(instructorId: string): Promise<boolean> {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { userId: true },
  });
  if (!instructor) return false;
  return hasActiveCalendarConnectionByUserId(instructor.userId);
}

// Re-checked at booking-creation/reschedule-acceptance time (not just in the
// GET /availability preview) so a stale client, race condition, or crafted
// request can't book outside the instructor's actual availability.
// Booking-vs-booking overlap is separately enforced by the `booking_no_overlap`
// DB constraint.
export async function isWithinAvailability(
  instructorId: string,
  scheduledAt: Date,
  durationMins: number
): Promise<boolean> {
  const connected = await hasActiveCalendarConnection(instructorId);
  if (!connected) return false;

  const rangeStart = scheduledAt;
  const rangeEnd = new Date(scheduledAt.getTime() + durationMins * 60_000);

  const busy = await prisma.instructorBusyBlock.findFirst({
    where: {
      instructorId,
      startsAt: { lt: rangeEnd },
      endsAt: { gt: rangeStart },
    },
    select: { id: true },
  });
  return !busy;
}
