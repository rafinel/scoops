import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { OrderPreview } from '@scoops/core/pdv/domain/structures'

export class OrderPreviewResponseDto {
  @ApiProperty({ type: Object }) cart!: object
  @ApiPropertyOptional({ type: Object }) channel?: object
  @ApiProperty({ description: 'Opaque ten-minute preview token.' }) previewToken!: string

  static from(preview: OrderPreview): OrderPreviewResponseDto {
    return Object.assign(new OrderPreviewResponseDto(), {
      cart: preview.cart,
      ...(preview.channel ? { channel: preview.channel } : {}),
      previewToken: preview.previewToken,
    })
  }
}
