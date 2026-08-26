import { useQuery } from '@tanstack/react-query'

import { discountQueryKeys } from '@/ui/pdv/hooks/discount-query-keys'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useComboQuery = (comboId: string | undefined) => {
  const { pdvService } = useRestContext()
  const query = useQuery({
    enabled: Boolean(comboId),
    queryKey: discountQueryKeys.detail(comboId ?? ''),
    queryFn: async () => {
      const response = await pdvService.getCombo(comboId as string)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })

  return {
    comboDetails: query.data,
    comboDetailsError: query.error,
    isComboDetailsError: query.isError,
    isLoadingComboDetails: Boolean(comboId) && query.isPending,
    refetchComboDetails: query.refetch,
  }
}
