import type { InferSelectModel } from 'drizzle-orm'

import type { productSizeModel } from '@/mrp/database/drizzle/models/product-size-model'

export type DrizzleProductSize = InferSelectModel<typeof productSizeModel>
