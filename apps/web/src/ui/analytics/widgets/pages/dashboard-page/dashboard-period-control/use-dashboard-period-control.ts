import type { AnalyticsPeriod } from '@scoops/core/analytics/domain/structures'

export const useDashboardPeriodControl = (
  period: AnalyticsPeriod,
  onChange: (period: AnalyticsPeriod) => void,
) => ({ period, onChange })
