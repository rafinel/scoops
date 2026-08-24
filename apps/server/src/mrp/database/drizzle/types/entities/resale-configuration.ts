import type { InferSelectModel } from 'drizzle-orm'

import type { resaleConfigurationModel } from '@/mrp/database/drizzle/models/resale-configuration-model'

export type DrizzleResaleConfiguration = InferSelectModel<typeof resaleConfigurationModel>
