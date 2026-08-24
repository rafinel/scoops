import type { Entity } from '#shared/domain/entities/entity.ts'

export type ResaleConfiguration = Entity & {
  establishmentId: string
  productId: string
  brandId?: string
  price: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
