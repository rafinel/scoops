import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { orderQueryKeys } from './order-query-keys'

export const useCancelOrderAction = () => {
  const queryClient = useQueryClient()
  const { account } = useAuthContext()
  const { pdvService } = useRestContext()
  const mutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const response = await pdvService.cancelOrder(orderId, { reason })
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
