import { OrderStatus } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

const ORDER_PERIODS = ['last-30-days', 'custom'] as const

const dateOnlyInputSchema = z.string().optional().catch(undefined)

const ordersSearchInputSchema = z.object({
  search: z.string().trim().catch(''),
  channelId: z
    .union([z.uuid(), z.literal('none')])
    .optional()
    .catch(undefined),
  status: z.enum(OrderStatus).optional().catch(undefined),
  period: z.enum(ORDER_PERIODS).catch('last-30-days'),
  from: dateOnlyInputSchema,
  to: dateOnlyInputSchema,
  page: z.coerce.number().int().min(1).catch(1),
})

export const ordersSearchSchema = ordersSearchInputSchema.transform(
  ({ search, channelId, status, period, from, to, page }) => {
    const commonSearch = { search, channelId, status }

    if (
      period === 'custom' &&
      from !== undefined &&
      to !== undefined &&
      isDateOnly(from) &&
      isDateOnly(to) &&
      from <= to
    ) {
      return { ...commonSearch, period, from, to, page }
    }

    if (period === 'last-30-days' && from === undefined && to === undefined) {
      return { ...commonSearch, period, page }
    }

    return { ...commonSearch, period: 'last-30-days' as const, page: 1 }
  },
)

export type OrdersSearch = z.infer<typeof ordersSearchSchema>

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
