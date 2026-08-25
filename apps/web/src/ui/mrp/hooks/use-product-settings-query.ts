import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export const productSettingsQueryKey = (productId: string) =>
  mrpQueryKeys.productSettings(productId)

export const useProductSettingsQuery = (productId: string) => {
  const { mrpService } = useRestContext()

  const query = useQuery({
    queryKey: productSettingsQueryKey(productId),
    queryFn: async () => {
      const response = await mrpService.getProductSettings(productId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(productId),
    retry: false,
  })

  return {
    settings: query.data,
    settingsError: query.error,
    hasSettingsError: query.isError,
    isLoadingSettings: query.isLoading,
    isPendingSettings: query.isPending,
    retrySettings: query.refetch,
  }
}
