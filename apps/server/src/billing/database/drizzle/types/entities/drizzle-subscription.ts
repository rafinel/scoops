import type { InferSelectModel } from 'drizzle-orm'

import type { subscriptionModel } from '@/billing/database/drizzle/models/subscription-model'

export type DrizzleSubscription = InferSelectModel<typeof subscriptionModel>
