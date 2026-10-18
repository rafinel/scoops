import { ApiProperty } from '@nestjs/swagger'
import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

export class SalesCatalogAccompanimentResponseDto {
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
