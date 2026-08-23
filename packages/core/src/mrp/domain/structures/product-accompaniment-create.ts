import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'

export type ProductAccompanimentCreate = Omit<
  ProductAccompaniment,
  'id' | 'createdAt' | 'updatedAt'
>
