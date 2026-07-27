import { z } from 'zod';

export const CHECKLIST_SIZE = 20;

const SCORE_LEVELS = [
  'NOT_COVERED',
  'NEEDS_PRACTICE',
  'UNDER_INSTRUCTION',
  'INDEPENDENT',
] as const;

const bookingIdParams = {
  params: z.object({
    id: z.string().min(1, { message: 'Booking id is required' }),
  }),
};

const getReport = bookingIdParams;

const upsertReport = {
  ...bookingIdParams,
  body: z.object({
    overallNotes: z.string().max(4000).optional(),
    scores: z
      .array(
        z.object({
          skillId: z.string().min(1, { message: 'skillId is required' }),
          level: z.enum(SCORE_LEVELS),
          scorePercent: z.number().int().min(0).max(100).optional(),
          note: z.string().max(1000).optional(),
        })
      )
      .length(CHECKLIST_SIZE, { message: `scores must include all ${CHECKLIST_SIZE} skills` }),
  }),
};

const publishReport = bookingIdParams;
const unpublishReport = bookingIdParams;

export default {
  getReport,
  upsertReport,
  publishReport,
  unpublishReport,
};
