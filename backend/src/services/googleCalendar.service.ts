import { google, calendar_v3 } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import config from '../config/config';
import { encrypt, decrypt } from '../utils/tokenEncryption';

const PROVIDER = 'google_calendar';

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.calendar.clientId,
    config.google.calendar.clientSecret,
    config.google.calendar.redirectUri
  );
}

export function getAuthUrl(userId: string): string {
  const oauth2 = makeOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: userId,
  });
}

async function fetchUserEmail(oauth2: any): Promise<string | null> {
  try {
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data } = await oauth2Api.userinfo.get();
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function saveTokens(userId: string, refreshToken: string, email: string | null): Promise<void> {
  const encrypted = encrypt(refreshToken);
  await prisma.userIntegration.upsert({
    where: { userId_provider: { userId, provider: PROVIDER } },
    create: {
      userId,
      provider: PROVIDER,
      encryptedToken: encrypted,
      enabled: true,
      externalEmail: email,
    },
    update: {
      encryptedToken: encrypted,
      enabled: true,
      externalEmail: email,
    },
  });
}

async function getRefreshToken(userId: string): Promise<string | null> {
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
    select: { enabled: true, externalEmail: true, updatedAt: true, syncCalendarId: true },
  });
  const watch = row
    ? await prisma.calendarWatch.findFirst({
        where: { userId, provider: PROVIDER },
        select: { expiration: true, syncToken: true, updatedAt: true },
      })
    : null;
  return {
    connected: !!row?.enabled,
    configured: Boolean(config.google.calendar.clientId),
    externalEmail: row?.externalEmail ?? null,
    syncCalendarId: row?.syncCalendarId ?? null,
    watchExpiration: watch?.expiration ?? null,
    lastSync: watch?.updatedAt ?? null,
    initialSyncDone: !!watch?.syncToken,
  };
}

export async function disconnect(userId: string): Promise<void> {
  const { stopWatch } = await import('./googleCalendarSync.service');
  await stopWatch(userId).catch(() => {});
  await prisma.calendarWatch.deleteMany({ where: { userId, provider: PROVIDER } });
  await prisma.userIntegration.deleteMany({ where: { userId, provider: PROVIDER } });
}

export async function markDisabled(userId: string, reason: string): Promise<void> {
  console.error(`[GoogleCalendar] disabling integration userId=${userId} reason=${reason}`);
  await prisma.userIntegration.updateMany({
    where: { userId, provider: PROVIDER },
    data: { enabled: false },
  });
  await prisma.calendarWatch.deleteMany({ where: { userId, provider: PROVIDER } });
}

export async function handleOAuthCallback(code: string, userId: string): Promise<void> {
  const oauth2 = makeOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned — user may need to re-authorise');
  }
  oauth2.setCredentials(tokens);
  const email = await fetchUserEmail(oauth2);
  await saveTokens(userId, tokens.refresh_token, email);

  const { startWatchAndInitialSync } = await import('./googleCalendarSync.service');
  await startWatchAndInitialSync(userId).catch(err => {
    console.error('[GoogleCalendar] initial sync failed', err?.message);
  });
}

export async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const refreshToken = await getRefreshToken(userId);
  if (!refreshToken) return null;

  const oauth2 = makeOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth: oauth2 });
}

function stableEventId(bookingId: string, roleSuffix: string): string {
  const base = bookingId.replace(/-/g, '').toLowerCase().replace(/[^a-v0-9]/g, 'a');
  return `${base}${roleSuffix}`.slice(0, 64);
}

type BookingEventParams = {
  bookingId: string;
  reference: string;
  lessonType: string;
  instructorName: string;
  studentName?: string;
  scheduledAt: Date;
  durationMins: number;
};

function buildEventBody(params: BookingEventParams, viewer: 'student' | 'instructor') {
  const end = new Date(params.scheduledAt.getTime() + params.durationMins * 60 * 1000);
  const lessonLabel = params.lessonType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const summary =
    viewer === 'instructor'
      ? `Lesson — ${params.studentName ?? 'Student'} (${lessonLabel})`
      : `Driving Lesson — ${lessonLabel}`;
  const description =
    viewer === 'instructor'
      ? `Booking ref: ${params.reference}\nStudent: ${params.studentName ?? 'Student'}\nDuration: ${params.durationMins / 60}hr\n\nManaged by AutoPilot Driving School`
      : `Booking ref: ${params.reference}\nInstructor: ${params.instructorName}\nDuration: ${params.durationMins / 60}hr\n\nManaged by AutoPilot Driving School`;

  return {
    summary,
    description,
    start: { dateTime: params.scheduledAt.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup' as const, minutes: 60 * 24 },
        { method: 'popup' as const, minutes: 60 },
      ],
    },
    extendedProperties: {
      private: {
        source: 'autopilot',
        bookingId: params.bookingId,
        role: viewer,
      },
    },
    source: {
      title: 'AutoPilot Driving School',
      url: 'https://autopilotdrivingschool.co.uk',
    },
  };
}

async function pushCreate(
  userId: string,
  params: BookingEventParams,
  viewer: 'student' | 'instructor'
): Promise<void> {
  const cal = await getCalendarClient(userId);
  if (!cal) return;
  try {
    await cal.events.insert({
      calendarId: 'primary',
      requestBody: {
        id: stableEventId(params.bookingId, viewer === 'instructor' ? 'i' : 's'),
        ...buildEventBody(params, viewer),
      },
    });
  } catch (err: any) {
    if (err?.code === 409) return; // idempotent
    if (err?.code === 401 || String(err?.message).includes('invalid_grant')) {
      await markDisabled(userId, 'invalid_grant on insert');
      return;
    }
    console.error('[GoogleCalendar] insert failed', err?.message);
  }
}

async function pushUpdate(
  userId: string,
  params: BookingEventParams,
  viewer: 'student' | 'instructor'
): Promise<void> {
  const cal = await getCalendarClient(userId);
  if (!cal) return;
  try {
    await cal.events.patch({
      calendarId: 'primary',
      eventId: stableEventId(params.bookingId, viewer === 'instructor' ? 'i' : 's'),
      requestBody: buildEventBody(params, viewer),
    });
  } catch (err: any) {
    if (err?.code === 404) {
      await pushCreate(userId, params, viewer);
      return;
    }
    if (err?.code === 401 || String(err?.message).includes('invalid_grant')) {
      await markDisabled(userId, 'invalid_grant on patch');
      return;
    }
    console.error('[GoogleCalendar] patch failed', err?.message);
  }
}

async function pushDelete(
  userId: string,
  bookingId: string,
  viewer: 'student' | 'instructor'
): Promise<void> {
  const cal = await getCalendarClient(userId);
  if (!cal) return;
  try {
    await cal.events.delete({
      calendarId: 'primary',
      eventId: stableEventId(bookingId, viewer === 'instructor' ? 'i' : 's'),
    });
  } catch (err: any) {
    if (err?.code === 404 || err?.code === 410) return;
    if (err?.code === 401 || String(err?.message).includes('invalid_grant')) {
      await markDisabled(userId, 'invalid_grant on delete');
      return;
    }
    console.error('[GoogleCalendar] delete failed', err?.message);
  }
}

/**
 * Legacy signature — kept so existing call sites keep working.
 * Pushes to the student's calendar as before.
 */
export async function createCalendarEvent(
  studentId: string,
  params: {
    bookingId: string;
    reference: string;
    lessonType: string;
    instructorName: string;
    scheduledAt: Date;
    durationMins: number;
  }
): Promise<void> {
  await pushCreate(studentId, params, 'student');
}

export async function updateCalendarEvent(
  studentId: string,
  params: {
    bookingId: string;
    reference: string;
    lessonType: string;
    instructorName: string;
    scheduledAt: Date;
    durationMins: number;
  }
): Promise<void> {
  await pushUpdate(studentId, params, 'student');
}

export async function deleteCalendarEvent(studentId: string, bookingId: string): Promise<void> {
  await pushDelete(studentId, bookingId, 'student');
}

/**
 * Broadcast to both student + instructor calendars. Silent no-op per side if disconnected.
 */
export async function broadcastBookingCreated(params: {
  studentId: string;
  instructorUserId?: string | null;
  bookingId: string;
  reference: string;
  lessonType: string;
  studentName: string;
  instructorName: string;
  scheduledAt: Date;
  durationMins: number;
}): Promise<void> {
  await Promise.all([
    pushCreate(params.studentId, params, 'student'),
    params.instructorUserId ? pushCreate(params.instructorUserId, params, 'instructor') : Promise.resolve(),
  ]);
}

export async function broadcastBookingUpdated(params: {
  studentId: string;
  instructorUserId?: string | null;
  bookingId: string;
  reference: string;
  lessonType: string;
  studentName: string;
  instructorName: string;
  scheduledAt: Date;
  durationMins: number;
}): Promise<void> {
  await Promise.all([
    pushUpdate(params.studentId, params, 'student'),
    params.instructorUserId ? pushUpdate(params.instructorUserId, params, 'instructor') : Promise.resolve(),
  ]);
}

export async function broadcastBookingDeleted(params: {
  studentId: string;
  instructorUserId?: string | null;
  bookingId: string;
}): Promise<void> {
  await Promise.all([
    pushDelete(params.studentId, params.bookingId, 'student'),
    params.instructorUserId
      ? pushDelete(params.instructorUserId, params.bookingId, 'instructor')
      : Promise.resolve(),
  ]);
}

/**
 * Kept for legacy start-up hook — table now Prisma-managed, no-op.
 */
export async function ensureIntegrationTable(): Promise<void> {
  return;
}

export const AUTOPILOT_SOURCE_TAG = 'autopilot';
export const PROVIDER_ID = PROVIDER;

export default {
  getAuthUrl,
  handleOAuthCallback,
  isConnected,
  getIntegrationStatus,
  disconnect,
  markDisabled,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  broadcastBookingCreated,
  broadcastBookingUpdated,
  broadcastBookingDeleted,
  ensureIntegrationTable,
  getCalendarClient,
};
