import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'

export type GlobalAccompanimentUpdate = Pick<
  GlobalAccompaniment,
  'accompanimentTypeId' | 'quantityPerPortion'
> & {
  /** Omitted keeps the stored price. */
  accompanimentPrice?: number
}
