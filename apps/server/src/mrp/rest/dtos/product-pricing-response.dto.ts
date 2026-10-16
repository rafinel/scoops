import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { ProductBrandResponseDto, ProductResponseDto } from './product-stock-response.dto'

export class ProductSizeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() name!: string
  @ApiProperty() quantity!: number
  @ApiProperty() price!: number
  @ApiProperty() isActive!: boolean
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
}

export class ProductSizePricingResponseDto {
  @ApiProperty({ type: () => ProductSizeResponseDto }) size!: ProductSizeResponseDto
  @ApiPropertyOptional() operatingCost?: number
  @ApiPropertyOptional() profit?: number
  @ApiPropertyOptional() marginPercentage?: number
}

export class ResaleConfigurationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiProperty() price!: number
  @ApiProperty() isActive!: boolean
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
}

export class ResalePricingResponseDto {
  @ApiPropertyOptional({ type: () => ResaleConfigurationResponseDto })
  configuration?: ResaleConfigurationResponseDto

  @ApiPropertyOptional({ type: () => ProductBrandResponseDto })
  brand?: ProductBrandResponseDto

  @ApiProperty() packageQuantity!: number
  @ApiPropertyOptional() price?: number
  @ApiProperty() isActive!: boolean
}

export class ProductPricingResponseDto {
  @ApiProperty({ type: () => ProductResponseDto }) product!: ProductResponseDto
  @ApiProperty({ enum: ['portion', 'resale-single', 'resale-by-brand', 'accompaniment'] })
  mode!: 'portion' | 'resale-single' | 'resale-by-brand' | 'accompaniment'
  @ApiProperty({ type: () => ProductSizePricingResponseDto, isArray: true })
  sizes!: ProductSizePricingResponseDto[]
  @ApiProperty({ type: () => ResalePricingResponseDto, isArray: true })
  resale!: ResalePricingResponseDto[]
  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description:
      'Saved product-wide Accompaniment sale price. Null means no price has been saved; zero means free.',
  })
  accompanimentPrice!: number | null
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 12.5,
    description:
      'Current applicable Resale price suggested for first setup. This value is not saved by this read.',
  })
  suggestedAccompanimentPrice!: number | null
}
