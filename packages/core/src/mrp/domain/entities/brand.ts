import type { Entity } from '#shared/domain/entities/entity.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type Brand = Entity & {
  productId: string
  name: string
  unit?: ProductUnit
  packageQuantity: number
  packagePrice: number
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export type BrandCreate = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'> & {
  unit?: ProductUnit
}

export type BrandUpdate = Partial<
  Pick<Brand, 'name' | 'unit' | 'packageQuantity' | 'packagePrice'>
>
