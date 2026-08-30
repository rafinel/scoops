import { pgEnum } from 'drizzle-orm/pg-core'

export const orderStockRestorationOutcomeModel = pgEnum(
  'pdv_order_stock_restoration_outcome',
  ['restored', 'skipped'],
)
