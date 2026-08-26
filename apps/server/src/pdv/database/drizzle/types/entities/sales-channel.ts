import type { InferSelectModel } from 'drizzle-orm'

import type { salesChannelModel } from '@/pdv/database/drizzle/models/sales-channel-model'

export type DrizzleSalesChannel = InferSelectModel<typeof salesChannelModel>
