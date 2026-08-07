import type { Entity } from '#shared/domain/entities/entity.ts'

export type Brand = Entity & {
  productId: string
  name: string
  packageQuantity: number
  packagePrice: number
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export type BrandCreate = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>

export type BrandUpdate = Partial<
  Pick<Brand, 'name' | 'packageQuantity' | 'packagePrice'>
>
