import type { AnalyticsInterval } from '#analytics/domain/structures/analytics-interval.ts'
import type { AnalyticsPeriod } from '#analytics/domain/structures/analytics-period.ts'

export type SalesAnalytics = {
  readonly period: AnalyticsPeriod
  readonly selected: AnalyticsInterval
  readonly comparison: AnalyticsInterval
  readonly updatedAt: Date
  readonly summary: {
    readonly netSalesCents: number
    readonly validOrders: number
    readonly averageTicketCents: number | null
    readonly comparison: Record<
      'netSales' | 'validOrders' | 'averageTicket',
      { readonly absolute: number; readonly percentage: number | null }
    >
  }
  readonly margin: {
    readonly coveredNetSalesCents: number
    readonly cogsCents: number
    readonly grossMarginCents: number | null
    readonly grossMarginPercentage: number | null
    readonly coveragePercentage: number
    readonly uncoveredNetSalesCents: number
    readonly affectedProducts: readonly {
      readonly name: string
      readonly currentProductId: string | null
    }[]
  }
  readonly cancellations: {
    readonly count: number
    readonly valueCents: number
  }
  readonly evolution: readonly {
    readonly key: string
    readonly label: string
    readonly startAt: Date
    readonly endAt: Date
    readonly netSalesCents: number
    readonly validOrders: number
  }[]
  readonly products: {
    readonly byNetSales: readonly {
      readonly productSnapshotId: string
      readonly name: string
      readonly currentProductId: string | null
      readonly netSalesCents: number
      readonly quantity: number
      readonly cogsCents: number
      readonly marginPercentage: number | null
      readonly coveragePercentage: number
    }[]
    readonly byQuantity: readonly {
      readonly productSnapshotId: string
      readonly name: string
      readonly currentProductId: string | null
      readonly netSalesCents: number
      readonly quantity: number
      readonly cogsCents: number
      readonly marginPercentage: number | null
      readonly coveragePercentage: number
    }[]
  }
  readonly channels: readonly {
    readonly snapshotId: string | null
    readonly name: string
    readonly currentId: string | null
    readonly netSalesCents: number
    readonly sharePercentage: number
    readonly validOrders: number
    readonly averageTicketCents: number
  }[]
}
