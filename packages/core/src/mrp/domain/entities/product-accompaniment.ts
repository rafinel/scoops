import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductAccompaniment = Entity & {
  establishmentId: string
  productId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  globalAccompanimentId?: string
  createdAt: Date
  updatedAt: Date
}
