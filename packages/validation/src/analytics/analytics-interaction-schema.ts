import { z } from 'zod'

export const analyticsInteractionSchema = z.strictObject({
  tenantId: z.string().min(1),
  event: z.enum([
    'dashboard-viewed',
    'period-changed',
    'manual-refresh',
    'focus-refresh',
    'drilldown-opened',
    'cost-review-opened',
    'source-failure',
    'stale-presented',
    'reconciliation-failure',
  ]),
  period: z.enum(['today', 'last-7-days', 'last-30-days', 'last-90-days']).optional(),
  target: z
    .enum([
      'dashboard',
      'summary',
      'cancellations',
      'evolution',
      'products',
      'channels',
      'stock',
      'cost-coverage',
    ])
    .optional(),
  source: z.enum(['sales', 'stock', 'ui']).optional(),
})

export type AnalyticsInteraction = z.infer<typeof analyticsInteractionSchema>
