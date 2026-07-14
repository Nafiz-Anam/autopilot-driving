import moment from 'moment';
import prisma from '../client';

export type DayWindow = { start: number; end: number };

export function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Collapses adjacent/overlapping template rows (admin grid saves one row per
// hour) into contiguous ranges so multi-hour lesson durations can span them.
export function mergeWindows(windows: DayWindow[]): DayWindow[] {
  if (windows.length === 0) return [];
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: DayWindow[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function getDayWindows(
  mode: 'CUSTOM_SLOTS' | 'CALENDAR_SYNC',
  dayOfWeek: number,
  templateByDay: Map<number, DayWindow[]>
): DayWindow[] {
  if (mode === 'CALENDAR_SYNC') return [{ start: 0, end: 24 * 60 }];
  return templateByDay.get(dayOfWeek) ?? [];
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
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { availabilityMode: true },
  });
  if (!instructor) return false;

  const rangeStart = scheduledAt;
  const rangeEnd = new Date(scheduledAt.getTime() + durationMins * 60_000);

  if (instructor.availabilityMode === 'CALENDAR_SYNC') {
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

  const dayStart = moment(scheduledAt).startOf('day');
  const startMins = moment(scheduledAt).diff(dayStart, 'minutes');
  const endMins = startMins + durationMins;
  if (endMins > 24 * 60) return false;

  const templateRows = await prisma.$queryRawUnsafe<Array<{ startTime: string; endTime: string }>>(
    `SELECT "startTime", "endTime" FROM "Availability" WHERE "instructorId" = $1 AND "dayOfWeek" = $2 AND "isAvailable" = true`,
    instructorId,
    dayStart.day()
  );
  const windows = mergeWindows(
    templateRows
      .map(r => ({
        start: parseHHMM(r.startTime.slice(0, 5)),
        end: parseHHMM(r.endTime.slice(0, 5)),
      }))
      .filter((w): w is DayWindow => w.start !== null && w.end !== null && w.end > w.start)
  );
  return windows.some(w => startMins >= w.start && endMins <= w.end);
}
