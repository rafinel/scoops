import { ApiProperty } from '@nestjs/swagger'
import type { Order } from '@scoops/core/pdv/domain/entities'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

import { OrderResponseDto } from '@/pdv/rest/dtos/order-response.dto'

export class OrderPageResponseDto {
  @ApiProperty({ type: () => OrderResponseDto, isArray: true })
  items!: OrderResponseDto[]

  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
  @ApiProperty() totalPages!: number

  static from(page: PaginationResponse<Order>): OrderPageResponseDto {
    return Object.assign(new OrderPageResponseDto(), {
      items: page.items.map(OrderResponseDto.from),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    })
  }
}
