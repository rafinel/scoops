import type { StockAttention } from '@scoops/core/analytics/domain/structures'
import { StockAttentionItemResponseDto } from './stock-attention-item-response.dto'

export class StockAttentionResponseDto {
  updatedAt!: Date
  items!: StockAttentionItemResponseDto[]

  static from(value: StockAttention): StockAttentionResponseDto {
    return Object.assign(new StockAttentionResponseDto(), {
      updatedAt: value.updatedAt,
      items: value.items.map((item) =>
        Object.assign(new StockAttentionItemResponseDto(), item),
      ),
    })
  }
}
