import { useEffect, useState } from 'react'
import type { AnalyticsPeriod } from '@scoops/core/analytics/domain/structures'
import type { AnalyticsInteraction } from '@scoops/validation'
import { useSalesAnalyticsQuery } from '@/ui/analytics/hooks/use-sales-analytics-query'
import { useStockAttentionQuery } from '@/ui/analytics/hooks/use-stock-attention-query'
import { useLogsAnalyticsInteractionAction } from '@/ui/analytics/hooks/use-logs-analytics-interaction-action'

type DashboardSourceInteraction = Omit<AnalyticsInteraction, 'tenantId'>

function createDashboardInteraction(
  event: DashboardSourceInteraction['event'],
  period: AnalyticsPeriod,
  target: DashboardSourceInteraction['target'],
  source: DashboardSourceInteraction['source'],
): DashboardSourceInteraction {
  return { event, period, target, source }
}

function getDashboardSourceInteraction(
  period: AnalyticsPeriod,
  target: 'summary' | 'stock',
  source: 'sales' | 'stock',
  status: { data: unknown; error: unknown; isStale: boolean },
): DashboardSourceInteraction | null {
  const event = status.isStale
    ? 'stale-presented'
    : status.error && !status.data
      ? 'source-failure'
      : null

  return event ? createDashboardInteraction(event, period, target, source) : null
}

export function useDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('last-30-days')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [coverageOpen, setCoverageOpen] = useState(false)
  const logInteraction = useLogsAnalyticsInteractionAction()
  const sales = useSalesAnalyticsQuery(period)
  const stock = useStockAttentionQuery()

  useEffect(() => {
    const salesInteraction = getDashboardSourceInteraction(period, 'summary', 'sales', {
      data: sales.data,
      error: sales.error,
      isStale: sales.isStale,
    })
    if (salesInteraction) logInteraction(salesInteraction)
    const stockInteraction = getDashboardSourceInteraction(period, 'stock', 'stock', {
      data: stock.data,
      error: stock.error,
      isStale: stock.isStale,
    })
    if (stockInteraction) logInteraction(stockInteraction)
  }, [
    logInteraction,
    period,
    sales.data,
    sales.error,
    sales.isStale,
    stock.data,
    stock.error,
    stock.isStale,
  ])
  async function refresh() {
    if (isRefreshing) return
    setIsRefreshing(true)
    logInteraction(
      createDashboardInteraction('manual-refresh', period, 'dashboard', 'ui'),
    )
    try {
      await Promise.all([sales.refetch(), stock.refetch()])
    } finally {
      setIsRefreshing(false)
    }
  }
  function changePeriod(nextPeriod: AnalyticsPeriod) {
    setPeriod(nextPeriod)
    logInteraction(
      createDashboardInteraction('period-changed', nextPeriod, 'dashboard', 'ui'),
    )
  }

  function handleCoverageOpenChange(isOpen: boolean) {
    setCoverageOpen(isOpen)
    if (isOpen) {
      logInteraction(
        createDashboardInteraction('cost-review-opened', period, 'cost-coverage', 'ui'),
      )
    }
  }

  return {
    period,
    sales,
    stock,
    isRefreshing: isRefreshing || sales.isRefreshing || stock.isRefreshing,
    coverageOpen,
    setPeriod: changePeriod,
    refresh,
    handleCoverageOpenChange,
  }
}
