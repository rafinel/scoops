import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'

export const useProductionPreviewQuery = (
  productId: string,
  quantity: number,
  isInputValid = true,
) => {
  const { mrpService } = useRestContext()
  return useQuery({
    queryKey: mrpQueryKeys.productionPreview(productId, quantity),
    queryFn: async () => {
      const response = await mrpService.previewProduction(productId, { quantity })
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: isInputValid && quantity > 0,
    retry: false,
  })
}
