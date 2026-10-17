import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { ProductResponseDto } from './product-stock-response.dto'

export class ProductAccompanimentDetailsResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) accompanimentProductId!: string
  @ApiProperty() accompanimentProductName!: string
  @ApiProperty({ format: 'uuid' }) accompanimentTypeId!: string
  @ApiProperty() accompanimentTypeName!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty() quantityPerPortion!: number
  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiPropertyOptional() brandName?: string
  @ApiPropertyOptional() unitCost?: number
  @ApiPropertyOptional() estimatedCost?: number
  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description:
      'Saved product-wide Accompaniment sale price. Null means unconfigured; zero means free.',
  })
  salePrice!: number | null

  @ApiProperty({
    description: 'Whether the row belongs to a global accompaniment shared by every Portion.',
  })
  isGlobal!: boolean

  @ApiProperty({
    description:
      'Whether the same product is individually linked to other Portions. Always false for global rows.',
  })
  hasOtherPortionLinks!: boolean
}

export class ProductAccompanimentsResponseDto {
  @ApiProperty({ type: () => ProductResponseDto }) product!: ProductResponseDto
  @ApiProperty({ type: () => ProductAccompanimentDetailsResponseDto, isArray: true })
  accompaniments!: ProductAccompanimentDetailsResponseDto[]
}
