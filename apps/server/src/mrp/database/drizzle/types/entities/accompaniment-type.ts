import type { InferSelectModel } from 'drizzle-orm'

import type { accompanimentTypeModel } from '../../models/accompaniment-type-model'

export type DrizzleAccompanimentType = InferSelectModel<typeof accompanimentTypeModel>
