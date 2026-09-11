import { NotificationKind } from '@scoops/core/communication/domain/structures'
import { z } from 'zod'

const notificationSchema = z.strictObject({
  id: z.uuid(),
  sourceEventId: z.string().trim().min(1).max(255),
  establishmentId: z.uuid(),
  recipientUserId: z.uuid(),
  kind: z.enum(NotificationKind),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
  occurredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  readAt: z.iso.datetime().nullable().optional(),
})

export const notificationRealtimeEventSchema = z.strictObject({
  version: z.literal(1),
  notification: notificationSchema,
})

export type NotificationRealtimeEvent = z.infer<typeof notificationRealtimeEventSchema>
