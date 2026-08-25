import type { StockTransaction } from '#mrp/domain/entities/stock-transaction.ts'
import type { StockTransactionListParams } from '#mrp/domain/structures/stock-transaction-list-params.ts'
import type { StockTransactionPage } from '#mrp/domain/structures/stock-transaction-page.ts'

export interface StockTransactionsRepository {
  add(input: Omit<StockTransaction, 'id'>): Promise<StockTransaction>
  findPage(
    establishmentId: string,
    productId: string,
    params: StockTransactionListParams,
  ): Promise<StockTransactionPage>
  countByProductId(establishmentId: string, productId: string): Promise<number>
  removeAll(): Promise<void>
}
