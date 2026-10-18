import { ApiProperty } from '@nestjs/swagger'

export class SalesCatalogBrandResponseDto {
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
