import type { InferSelectModel } from 'drizzle-orm'

import type { notificationModel } from '@/communication/database/drizzle/models/notification-model'

export type DrizzleNotification = InferSelectModel<typeof notificationModel>
