import { google } from 'googleapis';
import prisma from '../client';
import config from '../config/config';
import { encrypt, decrypt } from '../utils/tokenEncryption';

const PROVIDER = 'google_calendar';

// ── OAuth2 client ──────────────────────────────────────────────────────────────

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
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: userId,
  });
}

// ── Token storage ──────────────────────────────────────────────────────────────

export async function ensureIntegrationTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserIntegration" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      "encryptedToken" TEXT NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("userId", provider)
    )
  `);
}

async function saveTokens(userId: string, refreshToken: string): Promise<void> {
  const encrypted = encrypt(refreshToken);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserIntegration" ("userId", provider, "encryptedToken", "enabled")
     VALUES ($1, $2, $3, true)
     ON CONFLICT ("userId", provider)
     DO UPDATE SET "encryptedToken" = $3, "enabled" = true, "updatedAt" = NOW()`,
    userId, PROVIDER, encrypted
  );
}

async function getRefreshToken(userId: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<Array<{ encryptedToken: string; enabled: boolean }>>(
    `SELECT "encryptedToken", "enabled" FROM "UserIntegration"
     WHERE "userId" = $1 AND provider = $2 LIMIT 1`,
    userId, PROVIDER
  );
  if (!rows[0] || !rows[0].enabled) return null;
  try {
    return decrypt(rows[0].encryptedToken);
  } catch {
    return null;
  }
}

export async function isConnected(userId: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "UserIntegration"
     WHERE "userId" = $1 AND provider = $2 AND "enabled" = true LIMIT 1`,
    userId, PROVIDER
  );
  return rows.length > 0;
}

export async function disconnect(userId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "UserIntegration" WHERE "userId" = $1 AND provider = $2`,
    userId, PROVIDER
  );
}

// ── OAuth callback ─────────────────────────────────────────────────────────────

export async function handleOAuthCallback(code: string, userId: string): Promise<void> {
  const oauth2 = makeOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned — user may need to re-authorise');
  }
  await saveTokens(userId, tokens.refresh_token);
}

// ── Calendar client ────────────────────────────────────────────────────────────

async function getCalendarClient(userId: string) {
  const refreshToken = await getRefreshToken(userId);
  if (!refreshToken) return null;

  const oauth2 = makeOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth: oauth2 });
}

// ── Event helpers ──────────────────────────────────────────────────────────────

function stableEventId(bookingId: string): string {
  // Google event IDs: 5-1024 chars, base32hex (a-v, 0-9)
  return bookingId.replace(/-/g, '').toLowerCase().replace(/[^a-v0-9]/g, 'a').slice(0, 64);
}

function buildEventBody(params: {
  reference: string;
  lessonType: string;
  instructorName: string;
  scheduledAt: Date;
  durationMins: number;
}) {
  const end = new Date(params.scheduledAt.getTime() + params.durationMins * 60 * 1000);
  const lessonLabel = params.lessonType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    summary: `Driving Lesson — ${lessonLabel}`,
    description: `Booking reference: ${params.reference}\nInstructor: ${params.instructorName}\nDuration: ${params.durationMins / 60}hr\n\nManaged by AutoPilot Driving School`,
    start: { dateTime: params.scheduledAt.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 * 24 }, // 1 day before
        { method: 'popup', minutes: 60 },       // 1 hour before
      ],
    },
    source: {
      title: 'AutoPilot Driving School',
      url: 'https://autopilotdrivingschool.co.uk',
    },
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

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
  const cal = await getCalendarClient(studentId);
  if (!cal) return; // not connected — silently skip

  try {
    await cal.events.insert({
      calendarId: 'primary',
      requestBody: {
        id: stableEventId(params.bookingId),
        ...buildEventBody(params),
      },
    });
  } catch (err: any) {
    // 409 = event already exists (idempotent — ignore)
    if (err?.code !== 409) {
      console.error('[GoogleCalendar] createEvent failed', err?.message);
    }
  }
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
  const cal = await getCalendarClient(studentId);
  if (!cal) return;

  try {
    await cal.events.patch({
      calendarId: 'primary',
      eventId: stableEventId(params.bookingId),
      requestBody: buildEventBody(params),
    });
  } catch (err: any) {
    if (err?.code === 404) {
      // Event doesn't exist — create it instead
      await createCalendarEvent(studentId, params);
    } else {
      console.error('[GoogleCalendar] updateEvent failed', err?.message);
    }
  }
}

export async function deleteCalendarEvent(studentId: string, bookingId: string): Promise<void> {
  const cal = await getCalendarClient(studentId);
  if (!cal) return;

  try {
    await cal.events.delete({
      calendarId: 'primary',
      eventId: stableEventId(bookingId),
    });
  } catch (err: any) {
    // 404 = already gone — ignore
    if (err?.code !== 404) {
      console.error('[GoogleCalendar] deleteEvent failed', err?.message);
    }
  }
}

export default {
  getAuthUrl,
  handleOAuthCallback,
  isConnected,
  disconnect,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  ensureIntegrationTable,
};
