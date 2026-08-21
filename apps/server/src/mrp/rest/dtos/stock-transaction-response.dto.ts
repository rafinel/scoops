import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductUnit, StockAdjustmentType } from '@scoops/core/mrp/domain/structures'

export class StockTransactionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiProperty() productName!: string
  @ApiPropertyOptional() brandName?: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty({ enum: Object.values(StockAdjustmentType) })
  type!: StockAdjustmentType
  @ApiProperty() quantity!: number
  @ApiProperty() balanceAfter!: number
  @ApiProperty({ format: 'uuid' }) performedBy!: string
  @ApiProperty() performedByName!: string
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
}

export class StockTransactionPageResponseDto {
  @ApiProperty({ type: () => StockTransactionResponseDto, isArray: true })
  items!: StockTransactionResponseDto[]
  @ApiProperty() page!: number
  @ApiProperty() limit!: number
  @ApiProperty() total!: number
}
