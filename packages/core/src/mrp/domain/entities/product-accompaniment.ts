import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductAccompaniment = Entity & {
  establishmentId: string
  productId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  /** The link's own sale price; absent for a row that references a global (the global's price applies). */
  accompanimentPrice?: number
  globalAccompanimentId?: string
  createdAt: Date
  updatedAt: Date
}
