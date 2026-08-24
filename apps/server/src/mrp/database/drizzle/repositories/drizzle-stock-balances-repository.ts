import type { StockBalance } from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { StockBalancesRepository } from '@scoops/core/mrp/interfaces'
import { and, eq, gte, isNull, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { stockBalanceModel } from '../models/stock-balance-model'

@Injectable()
export class DrizzleStockBalancesRepository
  extends DrizzleRepository
  implements StockBalancesRepository
{
  async initialize(productId: string, brandId?: string): Promise<void> {
    await this.database
      .insert(stockBalanceModel)
      .values({ productId, brandId, quantity: '0', updatedAt: new Date() })
      .onConflictDoNothing()
  }

  async findByProductId(productId: string): Promise<StockBalance | undefined> {
    const [record] = await this.database
      .select()
      .from(stockBalanceModel)
      .where(
        and(
          eq(stockBalanceModel.productId, productId),
          isNull(stockBalanceModel.brandId),
        ),
      )
      .limit(1)
    return record
      ? {
          productId: record.productId,
          brandId: record.brandId ?? undefined,
          quantity: Number(record.quantity),
          idealQuantity: record.idealQuantity ? Number(record.idealQuantity) : undefined,
          situation: 'normal',
        }
      : undefined
  }

  async findByProductAndBrand(productId: string, brandId: string) {
    const [record] = await this.database
      .select()
      .from(stockBalanceModel)
      .where(
        and(
          eq(stockBalanceModel.productId, productId),
          eq(stockBalanceModel.brandId, brandId),
        ),
      )
      .limit(1)
    return record
      ? {
          productId: record.productId,
          brandId: record.brandId ?? undefined,
          quantity: Number(record.quantity),
          idealQuantity: record.idealQuantity ? Number(record.idealQuantity) : undefined,
          situation: 'normal' as const,
        }
      : undefined
  }

  async findManyByProductId(productId: string): Promise<readonly StockBalance[]> {
    const records = await this.database
      .select()
      .from(stockBalanceModel)
      .where(eq(stockBalanceModel.productId, productId))
    return records.map((record) => this.toDomain(record))
  }

  async add(
    target: Pick<StockBalance, 'productId' | 'brandId'>,
    signedQuantity: number,
    minimumQuantity?: number,
  ): Promise<StockBalance> {
    const targetFilter = target.brandId
      ? and(
          eq(stockBalanceModel.productId, target.productId),
          eq(stockBalanceModel.brandId, target.brandId),
        )
      : and(
          eq(stockBalanceModel.productId, target.productId),
          isNull(stockBalanceModel.brandId),
        )
    const quantityAfter = sql`${stockBalanceModel.quantity} + ${String(signedQuantity)}`
    const minimumFilter =
      minimumQuantity === undefined
        ? targetFilter
        : and(targetFilter, gte(quantityAfter, String(minimumQuantity)))
    const [record] = await this.database
      .update(stockBalanceModel)
      .set({ quantity: quantityAfter, updatedAt: new Date() })
      .where(minimumFilter)
      .returning()
    if (!record) throw new ConflictError('Database operation conflicted')
    return this.toDomain(record)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(stockBalanceModel)
  }

  private toDomain(record: typeof stockBalanceModel.$inferSelect): StockBalance {
    return {
      productId: record.productId,
      brandId: record.brandId ?? undefined,
      quantity: Number(record.quantity),
      idealQuantity: record.idealQuantity ? Number(record.idealQuantity) : undefined,
      situation: 'normal',
    }
  }
}
