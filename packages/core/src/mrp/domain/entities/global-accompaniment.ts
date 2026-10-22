import type { Entity } from '#shared/domain/entities/entity.ts'

export type GlobalAccompaniment = Entity & {
  establishmentId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  /** The one sale price shared by every row that references this global. */
  accompanimentPrice?: number
  createdAt: Date
  updatedAt: Date
}
