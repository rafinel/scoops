import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'

export type ProductAccompanimentUpdate = Pick<
  ProductAccompaniment,
  'accompanimentTypeId' | 'quantityPerPortion'
>
