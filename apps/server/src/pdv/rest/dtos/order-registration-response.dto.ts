import { ApiProperty } from '@nestjs/swagger'
import type { OrderRegistrationResult } from '@scoops/core/pdv/domain/structures'

import { OrderResponseDto } from '@/pdv/rest/dtos/order-response.dto'

export class RegisteredOrderResponseDto {
  @ApiProperty({ enum: ['registered'] }) kind!: 'registered'
  @ApiProperty({ type: () => OrderResponseDto }) order!: OrderResponseDto
  @ApiProperty() replayed!: boolean
}

export class RepricedOrderResponseDto {
  @ApiProperty({ enum: ['repriced'] }) kind!: 'repriced'
  @ApiProperty({ type: Object }) recalculatedCart!: object
  @ApiProperty({ description: 'Opaque ten-minute preview token.' }) previewToken!: string
  @ApiProperty({ type: Object, isArray: true }) changes!: readonly object[]
}

export class ReviewRequiredOrderResponseDto {
  @ApiProperty({ enum: ['review-required'] }) kind!: 'review-required'
  @ApiProperty({ type: Object, isArray: true }) shortages!: readonly object[]
  @ApiProperty({ type: Object, isArray: true }) changes!: readonly object[]
}

export class CorrectionRequiredOrderResponseDto {
  @ApiProperty({ enum: ['correction-required'] }) kind!: 'correction-required'
  @ApiProperty({ type: Object, isArray: true }) invalidConfigurations!: readonly object[]
  @ApiProperty({ type: Object, isArray: true }) shortages!: readonly object[]
  @ApiProperty({ type: Object, isArray: true }) changes!: readonly object[]
}

export class OrderRegistrationResponseDto {
  @ApiProperty({
    enum: ['registered', 'repriced', 'review-required', 'correction-required'],
  })
  kind!: OrderRegistrationResult['kind']

  static from(result: OrderRegistrationResult): OrderRegistrationResponseDto {
    if (result.kind === 'registered') {
      return Object.assign(new RegisteredOrderResponseDto(), {
        kind: result.kind,
        order: OrderResponseDto.from(result.order),
        replayed: result.replayed,
      }) as unknown as OrderRegistrationResponseDto
    }

    return Object.assign(new OrderRegistrationResponseDto(), result)
  }
}
