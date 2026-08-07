import type { Entity } from '#shared/domain/entities/entity.ts'

export type ResaleConfiguration = Entity & {
  productId: string
  brandId?: string
  packageQuantity: number
  price: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ResaleConfigurationCreate = Omit<
  ResaleConfiguration,
  'id' | 'createdAt' | 'updatedAt'
>

export type ResaleConfigurationUpdate = Partial<
  Pick<ResaleConfiguration, 'packageQuantity' | 'price' | 'isActive'>
>
