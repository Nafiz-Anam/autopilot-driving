import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import config from '../config/config';
import {
  getCalendarClient,
  markDisabled,
  PROVIDER_ID,
  AUTOPILOT_SOURCE_TAG,
} from './googleCalendar.service';

const WATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // Google max
const SYNC_HORIZON_DAYS = 90;

async function findInstructorIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.instructor.findFirst({
    where: { userId },
    select: { id: true },
  });
  return row?.id ?? null;
}

function extractStart(ev: any): { at: Date; allDay: boolean } | null {
  if (!ev.start) return null;
  if (ev.start.dateTime) return { at: new Date(ev.start.dateTime), allDay: false };
  if (ev.start.date) return { at: new Date(ev.start.date + 'T00:00:00Z'), allDay: true };
  return null;
}

function extractEnd(ev: any, fallback: Date): Date {
  if (ev.end?.dateTime) return new Date(ev.end.dateTime);
  if (ev.end?.date) return new Date(ev.end.date + 'T00:00:00Z');
  return new Date(fallback.getTime() + 60 * 60 * 1000);
}

async function upsertOrDeleteEvent(instructorId: string, ev: any): Promise<void> {
  if (!ev.id) return;
  // Skip echoes of events we ourselves pushed
  const source = ev.extendedProperties?.private?.source;
  if (source === AUTOPILOT_SOURCE_TAG) return;

  if (ev.status === 'cancelled') {
    await prisma.instructorBusyBlock.deleteMany({
      where: { instructorId, source: 'google', externalId: ev.id },
    });
    return;
  }

  const start = extractStart(ev);
  if (!start) return;
  const end = extractEnd(ev, start.at);

  await prisma.instructorBusyBlock.upsert({
    where: {
      instructorId_source_externalId: {
        instructorId,
        source: 'google',
        externalId: ev.id,
      },
    },
    create: {
      instructorId,
      source: 'google',
      externalId: ev.id,
      startsAt: start.at,
      endsAt: end,
      isAllDay: start.allDay,
    },
    update: {
      startsAt: start.at,
      endsAt: end,
      isAllDay: start.allDay,
    },
  });
}

export async function startWatchAndInitialSync(userId: string): Promise<void> {
  const cal = await getCalendarClient(userId);
  if (!cal) return;

  const instructorId = await findInstructorIdForUser(userId);
  // Students still get a watch (harmless — used later for their own calendar view),
  // but only instructors ingest busy blocks.

  // Kill any existing watch for this user first
  await stopWatch(userId).catch(() => {});

  // events.watch — subscribe to future changes
  if (!config.google.calendar.webhookUrl) {
    console.warn('[GoogleCalendarSync] webhookUrl not configured, skipping watch registration');
  } else {
    const channelId = uuidv4();
    try {
      const watchRes = await cal.events.watch({
        calendarId: 'primary',
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: config.google.calendar.webhookUrl,
          token: userId,
          expiration: String(Date.now() + WATCH_TTL_MS),
        },
      });

      await prisma.calendarWatch.create({
        data: {
          userId,
          provider: PROVIDER_ID,
          channelId,
          resourceId: watchRes.data.resourceId ?? '',
          expiration: watchRes.data.expiration
            ? new Date(Number(watchRes.data.expiration))
            : new Date(Date.now() + WATCH_TTL_MS),
        },
      });
    } catch (err: any) {
      if (err?.code === 401 || String(err?.message).includes('invalid_grant')) {
        await markDisabled(userId, 'invalid_grant on watch');
        return;
      }
      console.error('[GoogleCalendarSync] watch failed', err?.message);
    }
  }

  if (instructorId) {
    await runInitialSync(userId, instructorId).catch(err => {
      console.error('[GoogleCalendarSync] initial sync failed', err?.message);
    });
  }
}

async function runInitialSync(userId: string, instructorId: string): Promise<void> {
  const cal = await getCalendarClient(userId);
  if (!cal) return;

  const timeMin = new Date();
  const timeMax = new Date(Date.now() + SYNC_HORIZON_DAYS * 24 * 60 * 60 * 1000);

  let pageToken: string | undefined = undefined;
  let nextSyncToken: string | null | undefined = undefined;

  do {
    const { data } = await cal.events.list({
      calendarId: 'primary',
      singleEvents: true,
      showDeleted: false,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 250,
      pageToken,
    });
    for (const ev of data.items ?? []) {
      await upsertOrDeleteEvent(instructorId, ev);
    }
    pageToken = data.nextPageToken ?? undefined;
    nextSyncToken = data.nextSyncToken;
  } while (pageToken);

  if (nextSyncToken) {
    await prisma.calendarWatch.updateMany({
      where: { userId, provider: PROVIDER_ID },
      data: { syncToken: nextSyncToken },
    });
  }
}

export async function runIncrementalSync(userId: string): Promise<void> {
  const watch = await prisma.calendarWatch.findFirst({
    where: { userId, provider: PROVIDER_ID },
  });
  if (!watch?.syncToken) {
    // No sync token yet — kick a full initial sync
    const instructorId = await findInstructorIdForUser(userId);
    if (instructorId) await runInitialSync(userId, instructorId);
    return;
  }

  const cal = await getCalendarClient(userId);
  if (!cal) return;
  const instructorId = await findInstructorIdForUser(userId);
  if (!instructorId) return; // student — no busy ingest

  try {
    let pageToken: string | undefined;
    let nextSyncToken: string | null | undefined;
    do {
      const { data } = await cal.events.list({
        calendarId: 'primary',
        singleEvents: true,
        showDeleted: true,
        syncToken: pageToken ? undefined : watch.syncToken!,
        pageToken,
      });
      for (const ev of data.items ?? []) {
        await upsertOrDeleteEvent(instructorId, ev);
      }
      pageToken = data.nextPageToken ?? undefined;
      nextSyncToken = data.nextSyncToken;
    } while (pageToken);

    if (nextSyncToken) {
      await prisma.calendarWatch.update({
        where: { id: watch.id },
        data: { syncToken: nextSyncToken },
      });
    }
  } catch (err: any) {
    if (err?.code === 410) {
      console.warn('[GoogleCalendarSync] sync token expired, running full re-sync');
      await prisma.calendarWatch.update({
        where: { id: watch.id },
        data: { syncToken: null },
      });
      await runInitialSync(userId, instructorId);
      return;
    }
    if (err?.code === 401 || String(err?.message).includes('invalid_grant')) {
      await markDisabled(userId, 'invalid_grant on incremental sync');
      return;
    }
    console.error('[GoogleCalendarSync] incremental sync failed', err?.message);
  }
}

export async function handleWebhook(channelId: string, channelToken: string, resourceState: string): Promise<void> {
  if (resourceState === 'sync') return; // initial handshake
  const watch = await prisma.calendarWatch.findUnique({ where: { channelId } });
  if (!watch) {
    console.warn('[GoogleCalendarSync] webhook for unknown channelId', channelId);
    return;
  }
  if (channelToken && channelToken !== watch.userId) {
    console.warn('[GoogleCalendarSync] webhook token mismatch, ignoring');
    return;
  }
  await runIncrementalSync(watch.userId);
}

export async function stopWatch(userId: string): Promise<void> {
  const watches = await prisma.calendarWatch.findMany({
    where: { userId, provider: PROVIDER_ID },
  });
  if (!watches.length) return;
  const cal = await getCalendarClient(userId);
  for (const w of watches) {
    if (cal) {
      try {
        await cal.channels.stop({ requestBody: { id: w.channelId, resourceId: w.resourceId } });
      } catch (err: any) {
        if (err?.code !== 404 && err?.code !== 410) {
          console.error('[GoogleCalendarSync] channels.stop failed', err?.message);
        }
      }
    }
    await prisma.calendarWatch.delete({ where: { id: w.id } }).catch(() => {});
  }
}

export async function renewExpiringWatches(): Promise<void> {
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiring = await prisma.calendarWatch.findMany({
    where: { expiration: { lt: cutoff } },
    select: { userId: true },
    distinct: ['userId'],
  });
  for (const w of expiring) {
    try {
      await startWatchAndInitialSync(w.userId);
    } catch (err: any) {
      console.error(`[GoogleCalendarSync] renewal failed userId=${w.userId}`, err?.message);
    }
  }
}

export async function cleanupPastBusyBlocks(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  await prisma.instructorBusyBlock.deleteMany({
    where: { endsAt: { lt: cutoff } },
  });
}

export default {
  startWatchAndInitialSync,
  runIncrementalSync,
  handleWebhook,
  stopWatch,
  renewExpiringWatches,
  cleanupPastBusyBlocks,
};
