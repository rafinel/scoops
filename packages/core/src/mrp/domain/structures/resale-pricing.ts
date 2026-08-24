import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'

export type ResalePricing = {
  configuration?: ResaleConfiguration
  brand?: Brand
  packageQuantity: number
  price?: number
  isActive: boolean
}
