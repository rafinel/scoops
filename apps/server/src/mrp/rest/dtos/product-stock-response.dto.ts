import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  StockSituation,
} from '@scoops/core/mrp/domain/structures'

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty() name!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty({ enum: Object.values(ProductCategory), isArray: true })
  categories!: ProductCategory[]
  @ApiProperty({ enum: Object.values(ProductStockControl) })
  stockControl!: ProductStockControl
  @ApiProperty({ enum: Object.values(ProductStatus) }) status!: ProductStatus
  @ApiPropertyOptional() allowNegativeStock?: boolean
  @ApiPropertyOptional() idealStock?: number
  @ApiPropertyOptional() currentUnitCost?: number
  @ApiPropertyOptional() internalNotes?: string
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
}

export class ProductBrandResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() name!: string
  @ApiProperty() packageQuantity!: number
  @ApiProperty() packagePrice!: number
  @ApiProperty() isPrimary!: boolean
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
}

export class ProductBrandStockResponseDto {
  @ApiProperty({ type: () => ProductBrandResponseDto }) brand!: ProductBrandResponseDto
  @ApiProperty() stockQuantity!: number
  @ApiProperty() unitPrice!: number
}

export class ProductStockResponseDto {
  @ApiProperty({ type: () => ProductResponseDto }) product!: ProductResponseDto
  @ApiProperty() stockQuantity!: number
  @ApiPropertyOptional() idealStock?: number
  @ApiProperty({ enum: Object.values(StockSituation) })
  stockSituation!: StockSituation
  @ApiProperty({ type: () => ProductBrandStockResponseDto, isArray: true })
  brands!: ProductBrandStockResponseDto[]
}

export class StockBalanceResponseDto {
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiProperty() quantity!: number
  @ApiPropertyOptional() idealQuantity?: number
  @ApiProperty({ enum: Object.values(StockSituation) }) situation!: StockSituation
}
