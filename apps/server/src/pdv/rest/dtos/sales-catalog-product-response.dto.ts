import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { SalesCatalogProduct } from '@scoops/core/pdv/domain/structures'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

class SalesCatalogAccompanimentResponseDto {
  @ApiProperty({ format: 'uuid' })
  accompanimentId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ enum: ['g', 'ml', 'kg', 'l', 'un'] })
  unit!: ProductUnit

  @ApiProperty()
  type!: string

  @ApiProperty({ minimum: 0 })
  quantityPerPortion!: number

  @ApiProperty({ minimum: 0 })
  basePrice!: number

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  isAvailable!: boolean
}

class SalesCatalogSizeResponseDto {
  @ApiProperty({ format: 'uuid' })
  sizeId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ minimum: 0 })
  quantity!: number

  @ApiProperty({ minimum: 0 })
  basePrice!: number

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  isAvailable!: boolean

  @ApiProperty({ type: () => SalesCatalogAccompanimentResponseDto, isArray: true })
  accompaniments!: SalesCatalogAccompanimentResponseDto[]
}

class SalesCatalogBrandResponseDto {
  @ApiProperty({ format: 'uuid' })
  brandId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ minimum: 0 })
  basePrice!: number

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  isAvailable!: boolean
}

export class SalesCatalogProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  productId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ enum: ['portion', 'resale'] })
  kind!: SalesCatalogProduct['kind']

  @ApiProperty({ enum: ['single', 'by-brand'] })
  stockControl!: SalesCatalogProduct['stockControl']

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  isAvailable!: boolean

  @ApiProperty({ type: () => SalesCatalogSizeResponseDto, isArray: true })
  sizes!: SalesCatalogSizeResponseDto[]

  @ApiPropertyOptional({ minimum: 0 })
  resalePrice?: number

  @ApiProperty({ type: () => SalesCatalogBrandResponseDto, isArray: true })
  resaleBrands!: SalesCatalogBrandResponseDto[]

  static from(product: SalesCatalogProduct): SalesCatalogProductResponseDto {
    return Object.assign(new SalesCatalogProductResponseDto(), {
      productId: product.productId,
      name: product.name,
      unit: product.unit,
      kind: product.kind,
      stockControl: product.stockControl,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
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

export class SalesCatalogProductPageResponseDto {
  @ApiProperty({ type: () => SalesCatalogProductResponseDto, isArray: true })
  items!: SalesCatalogProductResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number

  static from(
    page: PaginationResponse<SalesCatalogProduct>,
  ): SalesCatalogProductPageResponseDto {
    return Object.assign(new SalesCatalogProductPageResponseDto(), {
      items: page.items.map(SalesCatalogProductResponseDto.from),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    })
  }
}
