import { z } from 'zod'

const NOTIFICATION_PERIODS = [
  'last-7-days',
  'last-30-days',
  'last-90-days',
  'all',
] as const

export const notificationsSearchSchema = z.strictObject({
  period: z.enum(NOTIFICATION_PERIODS).catch('last-30-days'),
})

export type NotificationsSearch = z.infer<typeof notificationsSearchSchema>
