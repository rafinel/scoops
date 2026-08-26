import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { salesChannelQueryKeys } from './sales-channel-query-keys'

export type CreateSalesChannelActionInput = {
  name: string
  percentage: number
  status: SalesChannelStatus
}

export const useCreateSalesChannelAction = () => {
  const { pdvService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: CreateSalesChannelActionInput) => {
      const response = await pdvService.createSalesChannel(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelQueryKeys.all }),
  })

  return {
    createSalesChannel: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
