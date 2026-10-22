import { useQuery } from '@tanstack/react-query'

import type { AccompanimentPortionListParams } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export type AccompanimentPortionsQueryInput = Omit<
  AccompanimentPortionListParams,
  'establishmentId' | 'accompanimentProductId'
>

export function useAccompanimentPortionsQuery(
  productId: string,
  input: AccompanimentPortionsQueryInput,
  enabled = true,
) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.accompanimentPortions(productId, input),
    queryFn: async () => {
      const response = await mrpService.listAccompanimentPortions(productId, input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(productId),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === productId ? previousData : undefined,
    retry: false,
  })
}
