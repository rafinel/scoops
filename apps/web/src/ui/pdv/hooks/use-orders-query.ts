import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { OrderListParams } from '@scoops/core/pdv/domain/structures'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { orderQueryKeys } from './order-query-keys'

export type OrdersQueryInput = Omit<OrderListParams, 'establishmentId'> & {
  isPeriodReady: boolean
}

export const useOrdersQuery = ({ isPeriodReady, ...input }: OrdersQueryInput) => {
  const { pdvService } = useRestContext()
  const { account } = useAuthContext()
  const establishmentId = account?.establishmentId ?? ''
  const query = useQuery({
    queryKey: orderQueryKeys.list(establishmentId, input),
    queryFn: async () => {
      const response = await pdvService.listOrders(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(establishmentId) && isPeriodReady,
    placeholderData: keepPreviousData,
    retry: false,
  })

  return {
    isLoadingOrders: query.isPending,
    ordersError: query.error,
    ordersPage: query.data,
    refetchOrders: query.refetch,
  }
}
