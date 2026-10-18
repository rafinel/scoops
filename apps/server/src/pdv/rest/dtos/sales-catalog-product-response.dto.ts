import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ProductUnit } from '@scoops/core/mrp/domain/structures'
import {
  SalesCatalogAvailability,
  type SalesCatalogListItem,
  type SalesCatalogProduct,
} from '@scoops/core/pdv/domain/structures'

import { SalesCatalogBrandResponseDto } from '@/pdv/rest/dtos/sales-catalog-brand-response.dto'
import { SalesCatalogSizeResponseDto } from '@/pdv/rest/dtos/sales-catalog-size-response.dto'

export class SalesCatalogProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  productId!: string

  @ApiProperty()
  name!: string

  @ApiPropertyOptional({ enum: ['g', 'ml', 'kg', 'l', 'un'] })
  unit?: ProductUnit

  @ApiProperty({ enum: ['portion', 'resale'] })
  kind!: SalesCatalogProduct['kind']

  @ApiProperty({ enum: ['single', 'by-brand'] })
  stockControl!: SalesCatalogProduct['stockControl']

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  isAvailable!: boolean

  @ApiProperty({ enum: Object.values(SalesCatalogAvailability) })
  availability!: SalesCatalogAvailability

  @ApiProperty({ type: () => SalesCatalogSizeResponseDto, isArray: true })
  sizes!: SalesCatalogSizeResponseDto[]

  @ApiPropertyOptional({ minimum: 0 })
  resalePrice?: number

  @ApiProperty({ type: () => SalesCatalogBrandResponseDto, isArray: true })
  resaleBrands!: SalesCatalogBrandResponseDto[]

  static from(product: SalesCatalogListItem): SalesCatalogProductResponseDto {
    return Object.assign(new SalesCatalogProductResponseDto(), {
      productId: product.productId,
      name: product.name,
      unit: product.unit,
      kind: product.kind,
      stockControl: product.stockControl,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      availability: product.availability,
      sizes: product.sizes.map((size) => ({
        sizeId: size.sizeId,
        name: size.name,
        quantity: size.quantity,
        basePrice: size.basePrice,
        isActive: size.isActive,
        isAvailable: size.isAvailable,
        accompaniments: size.accompaniments.map((accompaniment) => ({
          ...accompaniment,
        })),
      })),
      ...(product.resalePrice !== undefined ? { resalePrice: product.resalePrice } : {}),
      resaleBrands: product.resaleBrands.map((brand) => ({ ...brand })),
    })
  }
}
