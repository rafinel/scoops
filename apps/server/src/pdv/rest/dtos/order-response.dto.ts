import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) idempotencyKey!: string
  @ApiProperty() sequenceNumber!: number
  @ApiProperty({ format: 'uuid' }) createdBy!: string
  @ApiPropertyOptional({ type: Object }) channel?: object
  @ApiProperty({ type: Object, isArray: true }) lines!: readonly object[]
  @ApiProperty({ type: Object, isArray: true }) discounts!: readonly object[]
  @ApiProperty() subtotal!: number
  @ApiProperty() totalDiscount!: number
  @ApiProperty() total!: number
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static from(order: OrderDetails): OrderResponseDto {
    return Object.assign(new OrderResponseDto(), {
      ...order,
      ...(order.channel ? { channel: order.channel } : {}),
      lines: order.lines,
      discounts: order.discounts,
      createdAt: order.createdAt.toISOString(),
    })
  }
}
