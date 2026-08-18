import type { InferSelectModel } from 'drizzle-orm'

import type { productModel } from '../models/product-model'
import type { productBrandModel } from '../models/product-brand-model'

export type DrizzleProduct = InferSelectModel<typeof productModel>
export type DrizzleBrand = InferSelectModel<typeof productBrandModel>
