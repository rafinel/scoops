import { ApiProperty } from '@nestjs/swagger'

import { SalesCatalogAccompanimentResponseDto } from '@/pdv/rest/dtos/sales-catalog-accompaniment-response.dto'

export class SalesCatalogSizeResponseDto {
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
