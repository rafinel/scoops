import { useQuery } from '@tanstack/react-query'

import type { StockTransactionListParams } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const useStockTransactionsQuery = (
  productId: string,
  input: StockTransactionListParams,
) => {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.stockTransactions(productId, input),
    queryFn: async () => {
      const response = await mrpService.listStockTransactions(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(productId),
    placeholderData: (previousData) => previousData,
    retry: false,
  })
}
