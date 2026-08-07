import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductAccompaniment = Entity & {
  productId: string
  accompanimentProductId: string
  accompanimentTypeId: string
  quantityPerPortion: number
  createdAt: Date
  updatedAt: Date
}

export type ProductAccompanimentCreate = Omit<
  ProductAccompaniment,
  'id' | 'createdAt' | 'updatedAt'
>

export type ProductAccompanimentUpdate = Partial<
  Pick<ProductAccompaniment, 'accompanimentTypeId' | 'quantityPerPortion'>
>
