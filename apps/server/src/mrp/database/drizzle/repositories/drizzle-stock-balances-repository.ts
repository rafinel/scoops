import type { StockBalance, StockAdjustment } from '@scoops/core/mrp/domain/structures'
import type { StockBalancesRepository } from '@scoops/core/mrp/interfaces'
import { and, eq, isNull } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { stockBalanceModel } from '../models/stock-balance-model'

@Injectable()
export class DrizzleStockBalancesRepository
  extends DrizzleRepository
  implements StockBalancesRepository
{
  async initialize(productId: string): Promise<void> {
    await this.database
      .insert(stockBalanceModel)
      .values({ productId, quantity: '0', updatedAt: new Date() })
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

  async adjust(input: StockAdjustment): Promise<StockBalance> {
    const existing = input.brandId
      ? await this.findByProductAndBrand(input.productId, input.brandId)
      : await this.findByProductId(input.productId)
    const where = input.brandId
      ? and(
          eq(stockBalanceModel.productId, input.productId),
          eq(stockBalanceModel.brandId, input.brandId),
        )
      : and(
          eq(stockBalanceModel.productId, input.productId),
          isNull(stockBalanceModel.brandId),
        )

    if (existing) {
      await this.database
        .update(stockBalanceModel)
        .set({ quantity: String(input.quantity), updatedAt: input.occurredAt })
        .where(where)
    } else {
      await this.database.insert(stockBalanceModel).values({
        productId: input.productId,
        brandId: input.brandId,
        quantity: String(input.quantity),
        updatedAt: input.occurredAt,
      })
    }
    return {
      productId: input.productId,
      brandId: input.brandId,
      quantity: input.quantity,
      situation: 'normal',
    }
  }
}
