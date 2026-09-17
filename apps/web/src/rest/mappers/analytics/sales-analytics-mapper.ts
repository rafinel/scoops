import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'

export type SalesAnalyticsJson = Omit<
  SalesAnalytics,
  'selected' | 'comparison' | 'updatedAt' | 'evolution'
> & {
  selected: Omit<SalesAnalytics['selected'], 'startAt' | 'endAt'> & {
    startAt: string
    endAt: string
  }
  comparison: Omit<SalesAnalytics['comparison'], 'startAt' | 'endAt'> & {
    startAt: string
    endAt: string
  }
  updatedAt: string
  evolution: readonly (Omit<SalesAnalytics['evolution'][number], 'startAt' | 'endAt'> & {
    startAt: string
    endAt: string
  })[]
}

export const salesAnalyticsMapper = (value: SalesAnalyticsJson): SalesAnalytics => ({
  ...value,
  selected: {
    ...value.selected,
    startAt: new Date(value.selected.startAt),
    endAt: new Date(value.selected.endAt),
  },
  comparison: {
    ...value.comparison,
    startAt: new Date(value.comparison.startAt),
    endAt: new Date(value.comparison.endAt),
  },
  updatedAt: new Date(value.updatedAt),
  evolution: value.evolution.map((bucket) => ({
    ...bucket,
    startAt: new Date(bucket.startAt),
    endAt: new Date(bucket.endAt),
  })),
})
