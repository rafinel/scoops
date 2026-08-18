import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { RegisterProductInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useRegisterProductAction() {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RegisterProductInput) => {
      const response = await mrpService.registerProduct(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mrp', 'products'] })
    },
  })
}
