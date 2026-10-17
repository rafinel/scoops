import type { InferSelectModel } from 'drizzle-orm'

import type { globalAccompanimentModel } from '../../models/global-accompaniment-model'

export type DrizzleGlobalAccompaniment = InferSelectModel<typeof globalAccompanimentModel>
