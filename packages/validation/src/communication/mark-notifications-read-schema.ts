import { z } from 'zod'

export const markNotificationsReadSchema = z.strictObject({
  notificationIds: z
    .array(z.uuid())
    .min(1)
    .max(50)
    .transform((notificationIds) => [...new Set(notificationIds)]),
})

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>
