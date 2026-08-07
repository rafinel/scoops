import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductSize = Entity & {
  productId: string
  name: string
  quantity: number
  price: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ProductSizeCreate = Omit<ProductSize, 'id' | 'createdAt' | 'updatedAt'>

export type ProductSizeUpdate = Partial<
  Pick<ProductSize, 'name' | 'quantity' | 'price' | 'isActive'>
>
