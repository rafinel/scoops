import type { InferSelectModel } from 'drizzle-orm'

import type { stockTransactionModel } from '../../models/stock-transaction-model'

export type DrizzleStockTransaction = InferSelectModel<typeof stockTransactionModel>
