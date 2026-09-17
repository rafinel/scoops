import { z } from 'zod'

export const analyticsPeriodQuerySchema = z.strictObject({
  period: z
    .enum(['today', 'last-7-days', 'last-30-days', 'last-90-days'])
    .default('last-30-days'),
})

export type AnalyticsPeriodQuery = z.infer<typeof analyticsPeriodQuerySchema>
