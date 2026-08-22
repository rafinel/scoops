import type { InferSelectModel } from 'drizzle-orm'

import type { productionModel } from '../../models/production-model'

export type DrizzleProduction = InferSelectModel<typeof productionModel>
