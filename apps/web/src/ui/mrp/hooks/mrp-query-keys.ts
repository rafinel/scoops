import type { StockTransactionListParams } from '@scoops/core/mrp/domain/structures'

export const mrpQueryKeys = {
  all: ['mrp'] as const,
  products: () => [...mrpQueryKeys.all, 'products'] as const,
  productStock: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'stock'] as const,
  productRecipe: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'recipe'] as const,
  productionPreview: (productId: string, quantity: number) =>
    [...mrpQueryKeys.productRecipe(productId), 'preview', quantity] as const,
  stockTransactions: (productId: string, input: StockTransactionListParams) =>
    [...mrpQueryKeys.productStock(productId), 'transactions', input] as const,
}
