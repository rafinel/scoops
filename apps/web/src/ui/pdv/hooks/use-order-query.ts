import { useQuery } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { orderQueryKeys } from './order-query-keys'

export const useOrderQuery = (orderId: string) => {
  const { account } = useAuthContext()
  const { pdvService } = useRestContext()
  const establishmentId = account?.establishmentId ?? ''
  const query = useQuery({
    queryKey: orderQueryKeys.detail(establishmentId, orderId),
    queryFn: async () => {
      const response = await pdvService.getOrder(orderId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(establishmentId && orderId),
    retry: false,
  })

  return {
    isLoadingOrder: query.isPending,
    order: query.data,
    orderError: query.error,
    refetchOrder: query.refetch,
  }
}
