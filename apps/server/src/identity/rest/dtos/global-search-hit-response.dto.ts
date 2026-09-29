import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'
import type { GlobalSearchPageKey } from '@scoops/core/identity/domain/structures'

export class GlobalSearchHitResponseDto {
  @ApiProperty({
    enum: ['page', 'product', 'order', 'user', 'salesChannel', 'discount'],
  })
  kind!: GlobalSearchHit['kind']

  @ApiPropertyOptional({
    enum: [
      'dashboard',
      'products',
      'newSale',
      'orders',
      'salesChannels',
      'discounts',
      'users',
      'shopSettings',
      'subscription',
      'account',
      'accompanimentTypes',
    ] satisfies GlobalSearchPageKey[],
  })
  pageKey?: GlobalSearchPageKey

  @ApiPropertyOptional({ format: 'uuid' })
  productId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  orderId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  userId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  salesChannelId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  discountId?: string

  @ApiProperty()
  label!: string

  @ApiPropertyOptional()
  context?: string

  @ApiPropertyOptional()
  status?: string

  static from(hit: GlobalSearchHit): GlobalSearchHitResponseDto {
    const dto = new GlobalSearchHitResponseDto()
    Object.assign(dto, hit)
    return dto
  }
}
