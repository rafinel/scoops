import { useMutation } from '@tanstack/react-query'

import type {
  OrderRegistrationInput,
  OrderRegistrationResult,
} from '@scoops/core/pdv/domain/structures'
import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type RegisterOrderActionResult = {
  request: OrderRegistrationInput
  response: RestResponse<OrderRegistrationResult>
}

export const useRegisterOrderAction = () => {
  const { pdvService } = useRestContext()
  const mutation = useMutation({
    mutationFn: async (
      request: OrderRegistrationInput,
    ): Promise<RegisterOrderActionResult> => {
      return {
        request,
        response: await pdvService.registerOrder(request),
      }
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    registerOrder: mutation.mutateAsync,
  }
}
