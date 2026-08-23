import { useQuery } from '@tanstack/react-query'

import type { AccompanimentTypeListParams } from '@scoops/core/mrp/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'

export function useAccompanimentTypesQuery(
  input: Omit<AccompanimentTypeListParams, 'establishmentId'>,
) {
  const { mrpService } = useRestContext()

  return useQuery({
    queryKey: mrpQueryKeys.accompanimentTypes(input),
    queryFn: async () => {
      const response = await mrpService.listAccompanimentTypes(input)
      if (response.isFailure) response.throwError()
      return response.body
    },
    retry: false,
  })
}
