import { useQuery } from '@tanstack/react-query'

import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const usePreviewProductUnitChangeQuery = (
  productId: string,
  targetUnit?: ProductUnit,
  enabled = false,
) => {
  const { mrpService } = useRestContext()

  const query = useQuery({
    queryKey: mrpQueryKeys.productUnitChangePreview(productId, targetUnit ?? ''),
    queryFn: async () => {
      const response = await mrpService.previewProductUnitChange(productId, {
        targetUnit: targetUnit as ProductUnit,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId) && Boolean(targetUnit),
    retry: false,
  })

  return {
    unitChangePreview: query.data,
    unitChangePreviewError: query.error,
    hasUnitChangePreviewError: query.isError,
    isLoadingUnitChangePreview: query.isLoading,
    isPendingUnitChangePreview: query.isPending,
    retryUnitChangePreview: query.refetch,
  }
}
