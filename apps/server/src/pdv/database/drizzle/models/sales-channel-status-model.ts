import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import { pgEnum } from 'drizzle-orm/pg-core'

type SalesChannelStatusValue = SalesChannel['status']

export const salesChannelStatusModel = pgEnum('pdv_sales_channel_status', [
  'active',
  'inactive',
] as [SalesChannelStatusValue, ...SalesChannelStatusValue[]])
