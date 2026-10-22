import { ApiProperty } from '@nestjs/swagger'
import type { AccompanimentPortionsPage } from '@scoops/core/mrp/domain/structures'

import { AccompanimentPortionResponseDto } from './accompaniment-portion-response.dto'

export class AccompanimentPortionsPageResponseDto {
  @ApiProperty({ type: () => AccompanimentPortionResponseDto, isArray: true })
  items!: AccompanimentPortionResponseDto[]

  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
  @ApiProperty({ description: 'Zero when no Portion matches.' }) totalPages!: number

  @ApiProperty({
    description: 'Whether the establishment has at least one Portion product.',
  })
  hasPortionProducts!: boolean

  static from(page: AccompanimentPortionsPage): AccompanimentPortionsPageResponseDto {
    return Object.assign(new AccompanimentPortionsPageResponseDto(), {
      items: page.items.map(AccompanimentPortionResponseDto.from),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
      hasPortionProducts: page.hasPortionProducts,
    })
  }
}
