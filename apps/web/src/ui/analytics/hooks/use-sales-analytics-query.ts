import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { AnalyticsPeriod } from '@scoops/core/analytics/domain/structures'

export const useSalesAnalyticsQuery = (period: AnalyticsPeriod) => {
  const { analyticsService } = useRestContext()
  const query = useQuery({
    queryKey: ['analytics', 'sales', period],
    queryFn: async () => {
      const response = await analyticsService.getSales(period)
      if (!response.isSuccessful) response.throwError()
      return response.body
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && Boolean(query.data),
    isStale: Boolean(query.error && query.data),
    refetch: query.refetch,
  }
}
