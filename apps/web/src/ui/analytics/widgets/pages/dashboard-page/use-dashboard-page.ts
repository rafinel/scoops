import { useState } from 'react'
import type { AnalyticsPeriod } from '@scoops/core/analytics/domain/structures'
import { useSalesAnalyticsQuery } from '@/ui/analytics/hooks/use-sales-analytics-query'
import { useStockAttentionQuery } from '@/ui/analytics/hooks/use-stock-attention-query'
import { useAnalyticsInteraction } from '@/ui/analytics/hooks/use-analytics-interaction'

export const useDashboardPage = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('last-30-days')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const logInteraction = useAnalyticsInteraction()
  const sales = useSalesAnalyticsQuery(period)
  const stock = useStockAttentionQuery()
  const refresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    logInteraction({ event: 'manual-refresh', period, target: 'dashboard', source: 'ui' })
    try {
      await Promise.all([sales.refetch(), stock.refetch()])
    } finally {
      setIsRefreshing(false)
    }
  }
  const changePeriod = (nextPeriod: AnalyticsPeriod) => {
    setPeriod(nextPeriod)
    logInteraction({
      event: 'period-changed',
      period: nextPeriod,
      target: 'dashboard',
      source: 'ui',
    })
  }
  return {
    period,
    setPeriod: changePeriod,
    sales,
    stock,
    refresh,
    isRefreshing: isRefreshing || sales.isRefreshing || stock.isRefreshing,
  }
}
