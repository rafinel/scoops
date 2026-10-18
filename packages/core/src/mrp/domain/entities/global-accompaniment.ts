import type { Entity } from '#shared/domain/entities/entity.ts'

export type GlobalAccompaniment = Entity & {
  establishmentId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  createdAt: Date
  updatedAt: Date
}
