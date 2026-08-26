import { z } from 'zod'

const salesChannelAdjustmentFilterSchema = z.enum(['increase', 'discount', 'neutral'], {
  error: 'Selecione um filtro de ajuste válido.',
})

export const salesChannelsSearchSchema = z.object({
  adjustment: salesChannelAdjustmentFilterSchema.optional().catch(undefined),
})

export type SalesChannelAdjustmentFilter = z.infer<
  typeof salesChannelAdjustmentFilterSchema
>
