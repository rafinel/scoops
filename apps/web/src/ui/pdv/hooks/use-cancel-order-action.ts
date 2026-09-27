import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { orderQueryKeys } from './order-query-keys'

export const useCancelOrderAction = () => {
  const queryClient = useQueryClient()
  const { account } = useAuthContext()
  const { pdvService } = useRestContext()
  const mutation = useMutation({
    mutationFn: async ({ orderId, ...input }: CancelOrderVariables) => {
      const response = await pdvService.cancelOrder(orderId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (_order, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      void queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(
          account?.establishmentId ?? '',
          variables.orderId,
        ),
      })
    },
  })

  return {
    cancelOrder: mutation.mutateAsync,
    cancelOrderError: mutation.error,
    isCancelingOrder: mutation.isPending,
  }
}

type CancelOrderVariables = {
  orderId: string
} & Parameters<ReturnType<typeof useRestContext>['pdvService']['cancelOrder']>[1]
