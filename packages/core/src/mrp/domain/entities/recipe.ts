import type { Entity } from '#shared/domain/entities/entity.ts'

export type Recipe = Entity & {
  establishmentId: string
  productId: string
  yieldQuantity: number
  createdAt: Date
  updatedAt: Date
}
