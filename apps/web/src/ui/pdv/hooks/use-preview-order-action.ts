import { useMutation } from '@tanstack/react-query'

import type { OrderPreview, OrderPreviewInput } from '@scoops/core/pdv/domain/structures'
import type { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type PreviewOrderActionResult = {
  request: OrderPreviewInput
  response: RestResponse<OrderPreview>
}

export const usePreviewOrderAction = () => {
  const { pdvService } = useRestContext()
  const mutation = useMutation({
    mutationFn: async (request: OrderPreviewInput): Promise<PreviewOrderActionResult> => {
      return {
        request,
        response: await pdvService.previewOrder(request),
      }
    },
  })

  return {
    error: mutation.error,
    isPending: mutation.isPending,
    previewOrder: mutation.mutateAsync,
  }
}
