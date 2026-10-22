import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'

export type ProductAccompanimentUpdate = Pick<
  ProductAccompaniment,
  'accompanimentTypeId' | 'quantityPerPortion'
> & {
  /** Omitted keeps the stored price; `null` clears it. */
  accompanimentPrice?: number | null
}
