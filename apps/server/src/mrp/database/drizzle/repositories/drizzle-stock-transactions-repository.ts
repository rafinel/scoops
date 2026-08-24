import type { StockTransaction } from '@scoops/core/mrp/domain/entities'
import type { StockTransactionListParams } from '@scoops/core/mrp/domain/structures'
import type { StockTransactionsRepository } from '@scoops/core/mrp/interfaces'
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleStockTransactionMapper } from '../mappers/drizzle-stock-transaction-mapper'
import { stockTransactionModel } from '../models/stock-transaction-model'

@Injectable()
export class DrizzleStockTransactionsRepository
  extends DrizzleRepository
  implements StockTransactionsRepository
{
  async add(input: Omit<StockTransaction, 'id'>): Promise<StockTransaction> {
    const [record] = await this.database
      .insert(stockTransactionModel)
      .values({
        ...input,
        id: crypto.randomUUID(),
        brandId: input.brandId ?? null,
        brandName: input.brandName ?? null,
        productionId: input.productionId ?? null,
        quantity: String(input.quantity),
        balanceAfter: String(input.balanceAfter),
      })
      .returning()
    return DrizzleStockTransactionMapper.toDomain(record)
  }

  async findPage(
    establishmentId: string,
    productId: string,
    params: StockTransactionListParams,
  ) {
    const filters = this.buildFilters(establishmentId, productId, params)
    const [records, totals] = await Promise.all([
      this.database
        .select()
        .from(stockTransactionModel)
        .where(and(...filters))
        .orderBy(desc(stockTransactionModel.occurredAt), desc(stockTransactionModel.id))
        .limit(params.limit)
        .offset((params.page - 1) * params.limit),
      this.database
        .select({ count: count() })
        .from(stockTransactionModel)
        .where(and(...filters)),
    ])
    return {
      items: records.map(DrizzleStockTransactionMapper.toDomain),
      page: params.page,
      limit: params.limit,
      total: Number(totals[0]?.count ?? 0),
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(stockTransactionModel)
  }

  private buildFilters(
    establishmentId: string,
    productId: string,
    params: StockTransactionListParams,
  ): SQL[] {
    const filters: SQL[] = [
      eq(stockTransactionModel.establishmentId, establishmentId),
      eq(stockTransactionModel.productId, productId),
    ]
    if (params.type) filters.push(eq(stockTransactionModel.type, params.type))
    if (params.brandId) filters.push(eq(stockTransactionModel.brandId, params.brandId))
    if (params.from) filters.push(gte(stockTransactionModel.occurredAt, params.from))
    if (params.to) filters.push(lte(stockTransactionModel.occurredAt, params.to))
    return filters
  }
}
