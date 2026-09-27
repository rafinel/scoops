import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { OrderStatus } from '@scoops/core/pdv/domain/structures'

class OrderRestorationResponseDto {
  @ApiPropertyOptional({ minimum: 0, description: 'Omitted for legacy outcomes.' })
  linePosition?: number
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() productName!: string
  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiPropertyOptional() brandName?: string
  @ApiProperty({ minimum: 0, exclusiveMinimum: true }) quantity!: number
  @ApiProperty({ enum: ['restored', 'skipped', 'lost'] })
  outcome!: 'restored' | 'skipped' | 'lost'
}

class OrderCancellationResponseDto {
  @ApiProperty({ format: 'date-time' }) canceledAt!: string
  @ApiProperty({ format: 'uuid' }) canceledBy!: string
  @ApiProperty() canceledByName!: string
  @ApiPropertyOptional() reason?: string
  @ApiProperty({ type: () => OrderRestorationResponseDto, isArray: true })
  outcomes!: OrderRestorationResponseDto[]
}

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) idempotencyKey!: string
  @ApiProperty() sequenceNumber!: number
  @ApiProperty({ format: 'uuid' }) createdBy!: string
  @ApiProperty() createdByName!: string
  @ApiProperty({ enum: Object.values(OrderStatus) }) status!: OrderStatus
  @ApiPropertyOptional({ type: Object }) channel?: object
  @ApiProperty({ type: Object, isArray: true }) lines!: readonly object[]
  @ApiProperty({ type: Object, isArray: true }) discounts!: readonly object[]
  @ApiProperty() subtotal!: number
  @ApiProperty() totalDiscount!: number
  @ApiProperty() total!: number
  @ApiPropertyOptional({ type: () => OrderCancellationResponseDto })
  cancellation?: OrderCancellationResponseDto
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static from(order: OrderDetails): OrderResponseDto {
    return Object.assign(new OrderResponseDto(), {
      ...order,
      ...(order.channel ? { channel: order.channel } : {}),
      lines: order.lines,
      discounts: order.discounts,
      createdByName: order.createdByName,
      status: order.status,
      ...(order.cancellation
        ? {
            cancellation: {
              canceledAt: order.cancellation.canceledAt.toISOString(),
              canceledBy: order.cancellation.canceledBy,
              canceledByName: order.cancellation.canceledByName,
              ...(order.cancellation.reason ? { reason: order.cancellation.reason } : {}),
              outcomes: order.cancellation.outcomes.map((outcome) => ({ ...outcome })),
            },
          }
        : {}),
      createdAt: order.createdAt.toISOString(),
    })
  }
}
