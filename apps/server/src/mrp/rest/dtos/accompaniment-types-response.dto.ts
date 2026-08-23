import { ApiProperty } from '@nestjs/swagger'

export class AccompanimentTypeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty() name!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
}

export class AccompanimentTypeListItemResponseDto {
  @ApiProperty({ type: () => AccompanimentTypeResponseDto })
  type!: AccompanimentTypeResponseDto
  @ApiProperty() usageCount!: number
}

export class AccompanimentTypePageResponseDto {
  @ApiProperty({ type: () => AccompanimentTypeListItemResponseDto, isArray: true })
  items!: AccompanimentTypeListItemResponseDto[]

  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
  @ApiProperty() totalPages!: number
}
