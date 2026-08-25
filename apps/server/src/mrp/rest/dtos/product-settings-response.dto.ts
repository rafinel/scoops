import { ApiProperty } from '@nestjs/swagger'
import type { Product } from '@scoops/core/mrp/domain/entities'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import type { ProductSettingsDetails } from '@scoops/core/mrp/domain/structures'

class ProductSettingsProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty() name!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty({ enum: Object.values(ProductCategory), isArray: true })
  categories!: readonly ProductCategory[]
  @ApiProperty({ enum: Object.values(ProductStockControl) })
  stockControl!: ProductStockControl
  @ApiProperty({ enum: Object.values(ProductStatus) }) status!: ProductStatus
  @ApiProperty({ nullable: true }) allowNegativeStock!: boolean | null
  @ApiProperty({ nullable: true }) idealStock!: number | null
  @ApiProperty({ nullable: true }) currentUnitCost!: number | null
  @ApiProperty({ nullable: true }) internalNotes!: string | null
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string

  static from(product: Product): ProductSettingsProductResponseDto {
    return Object.assign(new ProductSettingsProductResponseDto(), {
      id: product.id,
      establishmentId: product.establishmentId,
      name: product.name,
      unit: product.unit,
      categories: [...product.categories],
      stockControl: product.stockControl,
      status: product.status,
      allowNegativeStock: product.allowNegativeStock ?? null,
      idealStock: product.idealStock ?? null,
      currentUnitCost: product.currentUnitCost ?? null,
      internalNotes: product.internalNotes ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  }
}

export class ProductSettingsResponseDto {
  @ApiProperty({ type: () => ProductSettingsProductResponseDto })
  product!: ProductSettingsProductResponseDto

  static from(details: ProductSettingsDetails): ProductSettingsResponseDto {
    return Object.assign(new ProductSettingsResponseDto(), {
      product: ProductSettingsProductResponseDto.from(details.product),
    })
  }

  static fromProduct(product: Product): ProductSettingsResponseDto {
    return ProductSettingsResponseDto.from({ product })
  }
}
