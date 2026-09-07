import type { eventModel } from '@/shared/database/drizzle/models/event-model'

export type DrizzleEvent = typeof eventModel.$inferSelect
