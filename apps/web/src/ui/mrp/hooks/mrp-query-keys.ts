import type {
  AccompanimentTypeListParams,
  StockTransactionListParams,
} from '@scoops/core/mrp/domain/structures'

export const mrpQueryKeys = {
  all: ['mrp'] as const,
  products: () => [...mrpQueryKeys.all, 'products'] as const,
  productStock: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'stock'] as const,
  productRecipe: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'recipe'] as const,
  productPricing: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'pricing'] as const,
  productAccompaniments: (productId: string) =>
    [...mrpQueryKeys.products(), productId, 'accompaniments'] as const,
  accompanimentCandidates: (input: unknown) =>
    [...mrpQueryKeys.products(), 'accompaniment-candidates', input] as const,
  accompanimentTypes: (input: Omit<AccompanimentTypeListParams, 'establishmentId'>) =>
    [...mrpQueryKeys.all, 'accompaniment-types', input] as const,
  productionPreview: (productId: string, quantity: number) =>
    [...mrpQueryKeys.productRecipe(productId), 'preview', quantity] as const,
  stockTransactions: (productId: string, input: StockTransactionListParams) =>
    [...mrpQueryKeys.productStock(productId), 'transactions', input] as const,
}
