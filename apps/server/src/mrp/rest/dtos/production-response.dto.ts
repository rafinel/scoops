import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductUnit } from '@scoops/core/mrp/domain/structures'

export class ProductionConsumptionResponseDto {
  @ApiProperty({ format: 'uuid' }) ingredientProductId!: string
  @ApiProperty() ingredientProductName!: string
  @ApiPropertyOptional({ format: 'uuid' }) ingredientBrandId?: string
  @ApiPropertyOptional() ingredientBrandName?: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty() quantity!: number
  @ApiProperty() unitCost!: number
  @ApiProperty() lineCost!: number
  @ApiProperty() currentBalance!: number
  @ApiProperty() projectedBalance!: number
  @ApiProperty() missingQuantity!: number
  @ApiProperty() allowsNegativeStock!: boolean
}

export class ProductionPreviewResponseDto {
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty() quantity!: number
  @ApiProperty() recipeYield!: number
  @ApiPropertyOptional() batches?: number
  @ApiProperty({ type: () => ProductionConsumptionResponseDto, isArray: true })
  consumptions!: ProductionConsumptionResponseDto[]
  @ApiProperty() totalCost!: number
  @ApiProperty() currentOutputStock!: number
  @ApiProperty() projectedOutputStock!: number
  @ApiProperty() canProduce!: boolean
  @ApiProperty({ isArray: true }) blockReasons!: string[]
}

export class ProductionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() productName!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty({ format: 'uuid' }) recipeId!: string
  @ApiProperty() recipeYield!: number
  @ApiProperty() quantity!: number
  @ApiProperty() totalCost!: number
  @ApiProperty({ format: 'uuid' }) performedBy!: string
  @ApiProperty() performedByName!: string
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
}
