import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductSize = Entity & {
  establishmentId: string
  productId: string
  name: string
  quantity: number
  price: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
