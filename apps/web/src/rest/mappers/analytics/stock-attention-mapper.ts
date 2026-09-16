import type { StockAttention } from '@scoops/core/analytics/domain/structures'

export type StockAttentionJson = Omit<StockAttention, 'updatedAt'> & { updatedAt: string }

export const stockAttentionMapper = (value: StockAttentionJson): StockAttention => ({
  ...value,
  updatedAt: new Date(value.updatedAt),
})
