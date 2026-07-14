import * as ical from 'node-ical';
import prisma from '../client';
import { encrypt, decrypt } from '../utils/tokenEncryption';

const PROVIDER = 'apple_ics';
const SOURCE = 'apple_ics';
const SYNC_HORIZON_DAYS = 90;

/**
 * Apple Calendar integration is a pull-only ICS feed:
 *   - User pastes a public/shared iCloud ICS URL (webcal:// or https://).
 *   - We fetch it every N minutes, parse VEVENTs, upsert InstructorBusyBlock rows.
 *   - No credentials, no push. Push side is handled by our own outbound ICS feed
 *     which the user subscribes to in Apple Calendar separately.
 */

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (url.startsWith('webcal://')) url = 'https://' + url.slice('webcal://'.length);
  if (url.startsWith('webcals://')) url = 'https://' + url.slice('webcals://'.length);
  return url;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Autopilot-DrivingSchool/1.0 (+https://autopilotdrivingschool.co.uk)',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`ICS fetch failed: HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Response is not an ICS feed');
  return text;
}

async function findInstructorIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.instructor.findFirst({ where: { userId }, select: { id: true } });
  return row?.id ?? null;
}

type ParsedEvent = {
  externalId: string;
  startsAt: Date;
  endsAt: Date;
  isAllDay: boolean;
};

function parseEvents(icsText: string, horizonEnd: Date): ParsedEvent[] {
  const parsed = ical.sync.parseICS(icsText);
  const now = new Date();
  const events: ParsedEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const item: any = parsed[key];
    if (item?.type !== 'VEVENT') continue;
    if (!item.start || !item.end) continue;

    const uid = item.uid ?? key;

    // Handle recurring events by expanding via rrule
    if (item.rrule) {
      const instances: Date[] = item.rrule.between(now, horizonEnd, true);
      const duration = new Date(item.end).getTime() - new Date(item.start).getTime();
      for (const instStart of instances) {
        // Skip cancelled recurrence overrides
        const rid = instStart.toISOString();
        if (item.recurrences?.[rid]?.status === 'CANCELLED') continue;
        // Apply per-instance overrides if present
        const override = item.recurrences?.[rid];
        const start = override ? new Date(override.start) : instStart;
        const end = override ? new Date(override.end) : new Date(instStart.getTime() + duration);
        events.push({
          externalId: `${uid}::${instStart.toISOString()}`,
          startsAt: start,
          endsAt: end,
          isAllDay: !!(item.datetype === 'date'),
        });
      }
    } else {
      const start = new Date(item.start);
      const end = new Date(item.end);
      if (end < now) continue;
      if (start > horizonEnd) continue;
      events.push({
        externalId: uid,
        startsAt: start,
        endsAt: end,
        isAllDay: !!(item.datetype === 'date'),
      });
    }
  }

  return events;
}

export async function getStoredUrl(userId: string): Promise<string | null> {
  const row = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
  });
  if (!row || !row.enabled) return null;
  try {
    return decrypt(row.encryptedToken);
  } catch {
    return null;
  }
}

export async function isConnected(userId: string): Promise<boolean> {
  const row = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
    select: { enabled: true },
  });
  return !!row?.enabled;
}

export async function getIntegrationStatus(userId: string) {
  const row = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
    select: { enabled: true, updatedAt: true, externalEmail: true },
  });
  return {
    connected: !!row?.enabled,
    lastSync: row?.updatedAt ?? null,
    label: row?.externalEmail ?? null,
  };
}

/**
 * Save an ICS URL for the user and kick an initial sync.
 * Returns { ok: false, reason } on validation / fetch failure.
 */
export async function connect(
  userId: string,
  rawUrl: string,
  label?: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const url = normalizeUrl(rawUrl);
  if (!isValidUrl(url)) return { ok: false, reason: 'Invalid URL' };

  // Test-fetch before saving so we catch bad URLs immediately
  try {
    await fetchIcs(url);
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? 'Fetch failed' };
  }

  const encrypted = encrypt(url);
  await prisma.userIntegration.upsert({
    where: { userId_provider: { userId, provider: PROVIDER } },
    create: {
      userId,
      provider: PROVIDER,
      encryptedToken: encrypted,
      enabled: true,
      externalEmail: label ?? null,
    },
    update: {
      encryptedToken: encrypted,
      enabled: true,
      externalEmail: label ?? null,
    },
  });

  // Fire-and-forget initial sync so response is fast
  syncOne(userId).catch(err => {
    console.error(`[appleCalendar] initial sync failed userId=${userId}`, err?.message);
  });

  return { ok: true };
}

export async function disconnect(userId: string): Promise<void> {
  const instructorId = await findInstructorIdForUser(userId);
  await prisma.userIntegration.deleteMany({ where: { userId, provider: PROVIDER } });
  if (instructorId) {
    await prisma.instructorBusyBlock.deleteMany({
      where: { instructorId, source: SOURCE },
    });
  }
}

/**
 * Sync a single user's ICS feed → InstructorBusyBlock rows.
 * Only instructors get busy blocks written; students get their URL stored but
 * blocks aren't ingested (no use case yet).
 */
export async function syncOne(
  userId: string
): Promise<{ inserted: number; removed: number } | null> {
  const url = await getStoredUrl(userId);
  if (!url) return null;

  const instructorId = await findInstructorIdForUser(userId);
  if (!instructorId) return { inserted: 0, removed: 0 };

  let icsText: string;
  try {
    icsText = await fetchIcs(url);
  } catch (err: any) {
    console.error(`[appleCalendar] fetch failed userId=${userId}`, err?.message);
    return null;
  }

  const horizonEnd = new Date(Date.now() + SYNC_HORIZON_DAYS * 24 * 60 * 60 * 1000);
  const parsed = parseEvents(icsText, horizonEnd);

  const seen = new Set(parsed.map(p => p.externalId));

  // Fetch existing apple_ics blocks for this instructor
  const existing = await prisma.instructorBusyBlock.findMany({
    where: { instructorId, source: SOURCE },
    select: { id: true, externalId: true },
  });

  const toDelete = existing.filter(e => !seen.has(e.externalId)).map(e => e.id);
  if (toDelete.length) {
    await prisma.instructorBusyBlock.deleteMany({ where: { id: { in: toDelete } } });
  }

  let inserted = 0;
  for (const ev of parsed) {
    await prisma.instructorBusyBlock.upsert({
      where: {
        instructorId_source_externalId: {
          instructorId,
          source: SOURCE,
          externalId: ev.externalId,
        },
      },
      create: {
        instructorId,
        source: SOURCE,
        externalId: ev.externalId,
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        isAllDay: ev.isAllDay,
      },
      update: {
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        isAllDay: ev.isAllDay,
      },
    });
    inserted++;
  }

  // Bump updatedAt on the integration row so status shows fresh lastSync
  await prisma.userIntegration.updateMany({
    where: { userId, provider: PROVIDER },
    data: { enabled: true },
  });

  return { inserted, removed: toDelete.length };
}

/**
 * Sync all connected users. Called by cron every N minutes.
 */
export async function syncAll(): Promise<void> {
  const rows = await prisma.userIntegration.findMany({
    where: { provider: PROVIDER, enabled: true },
    select: { userId: true },
  });
  for (const r of rows) {
    try {
      await syncOne(r.userId);
    } catch (err: any) {
      console.error(`[appleCalendar] syncAll userId=${r.userId}`, err?.message);
    }
  }
}

export default {
  connect,
  disconnect,
  isConnected,
  getIntegrationStatus,
  syncOne,
  syncAll,
};
