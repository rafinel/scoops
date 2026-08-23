import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateProductAccompanimentInput } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useUpdateProductAccompanimentAction(productId: string) {
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      linkId,
      input,
    }: {
      linkId: string
      input: UpdateProductAccompanimentInput
    }) => {
      const response = await mrpService.updateProductAccompaniment(
        productId,
        linkId,
        input,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: mrpQueryKeys.productAccompaniments(productId),
      }),
  })
  return { ...mutation, updateProductAccompaniment: mutation.mutateAsync }
}
