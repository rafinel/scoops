import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useProductionPreviewQuery = (
  productId: string,
  quantity: number,
  isInputValid = true,
) => {
  const { mrpService } = useRestContext()
  const query = useQuery({
    queryKey: mrpQueryKeys.productionPreview(productId, quantity),
    queryFn: async () => {
      const response = await mrpService.previewProduction(productId, { quantity })
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: isInputValid && quantity > 0,
    placeholderData: (previousData) => previousData,
    retry: false,
  })

  return {
    ...query,
    isRefreshing: query.isFetching && Boolean(query.data),
  }
}
