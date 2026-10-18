import { ApiProperty } from '@nestjs/swagger'
import type { SalesCatalogListItem } from '@scoops/core/pdv/domain/structures'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

import { SalesCatalogProductResponseDto } from '@/pdv/rest/dtos/sales-catalog-product-response.dto'

export class SalesCatalogProductPageResponseDto {
  @ApiProperty({ type: () => SalesCatalogProductResponseDto, isArray: true })
  items!: SalesCatalogProductResponseDto[]

  @ApiProperty()
  page!: number

  @ApiProperty()
  pageSize!: number

  @ApiProperty()
  total!: number

  @ApiProperty()
  totalPages!: number

  static from(
    page: PaginationResponse<SalesCatalogListItem>,
  ): SalesCatalogProductPageResponseDto {
    return Object.assign(new SalesCatalogProductPageResponseDto(), {
      items: page.items.map(SalesCatalogProductResponseDto.from),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    })
  }
}
