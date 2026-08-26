import { ApiProperty } from '@nestjs/swagger'
import type { ComboDetails } from '@scoops/core/pdv/domain/structures'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

import { ComboResponseDto } from '@/pdv/rest/dtos/combo-response.dto'

export class ComboPageResponseDto {
  @ApiProperty({ type: () => ComboResponseDto, isArray: true })
  items!: ComboResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number

  static from(page: PaginationResponse<ComboDetails>): ComboPageResponseDto {
    return Object.assign(new ComboPageResponseDto(), {
      items: page.items.map(ComboResponseDto.from),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    })
  }
}
