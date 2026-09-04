import { pgEnum } from 'drizzle-orm/pg-core'

export const eventStatusModel = pgEnum('event_status', [
  'pending',
  'publishing',
  'published',
  'failed',
])

export type EventStatus = (typeof eventStatusModel.enumValues)[number]
