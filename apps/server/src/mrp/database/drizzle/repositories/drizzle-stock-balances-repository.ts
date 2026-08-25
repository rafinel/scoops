import type { StockBalance } from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { StockBalancesRepository } from '@scoops/core/mrp/interfaces'
import { and, count, eq, exists, gte, isNull, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { productModel } from '../models/product-model'
import { stockBalanceModel } from '../models/stock-balance-model'

@Injectable()
export class DrizzleStockBalancesRepository
  extends DrizzleRepository
  implements StockBalancesRepository
{
  async initialize(
    establishmentId: string,
    productId: string,
    brandId?: string,
  ): Promise<void>
  async initialize(productId: string, brandId?: string): Promise<void>
  async initialize(
    establishmentOrProductId: string,
    productIdOrBrandId?: string,
    scopedBrandId?: string,
  ): Promise<void> {
    const isScoped = scopedBrandId !== undefined
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = isScoped ? scopedBrandId : productIdOrBrandId
    if (!productId) throw new ConflictError('Database operation conflicted')
    if (isScoped && !(await this.hasProduct(productId, establishmentOrProductId))) {
      throw new ConflictError('Database operation conflicted')
    }
    await this.database
      .insert(stockBalanceModel)
      .values({ productId, brandId, quantity: '0', updatedAt: new Date() })
      .onConflictDoNothing()
  }

  async findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<StockBalance | undefined>
  async findByProductId(productId: string): Promise<StockBalance | undefined>
  async findByProductId(
    establishmentOrProductId: string,
    scopedProductId?: string,
  ): Promise<StockBalance | undefined> {
    const isScoped = scopedProductId !== undefined
    const productId = scopedProductId ?? establishmentOrProductId
    const filters = [
      eq(stockBalanceModel.productId, productId),
      isNull(stockBalanceModel.brandId),
    ]
    if (isScoped)
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    const [record] = await this.database
      .select()
      .from(stockBalanceModel)
      .where(and(...filters))
      .limit(1)
    return record ? this.toDomain(record) : undefined
  }

  async findByProductAndBrand(
    establishmentId: string,
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  async findByProductAndBrand(
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  async findByProductAndBrand(
    establishmentOrProductId: string,
    productIdOrBrandId: string,
    scopedBrandId?: string,
  ): Promise<StockBalance | undefined> {
    const isScoped = scopedBrandId !== undefined
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = scopedBrandId ?? productIdOrBrandId
    const filters = [
      eq(stockBalanceModel.productId, productId),
      eq(stockBalanceModel.brandId, brandId),
    ]
    if (isScoped)
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    const [record] = await this.database
      .select()
      .from(stockBalanceModel)
      .where(and(...filters))
      .limit(1)
    return record ? this.toDomain(record) : undefined
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly StockBalance[]>
  async findManyByProductId(productId: string): Promise<readonly StockBalance[]>
  async findManyByProductId(
    establishmentOrProductId: string,
    scopedProductId?: string,
  ): Promise<readonly StockBalance[]> {
    const isScoped = scopedProductId !== undefined
    const productId = scopedProductId ?? establishmentOrProductId
    const filters = [eq(stockBalanceModel.productId, productId)]
    if (isScoped)
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    const records = await this.database
      .select()
      .from(stockBalanceModel)
      .where(and(...filters))
    return records.map((record) => this.toDomain(record))
  }

  async countByProductId(establishmentId: string, productId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(stockBalanceModel)
      .where(
        and(
          eq(stockBalanceModel.productId, productId),
          this.productBelongsToEstablishment(productId, establishmentId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replaceQuantity(
    establishmentId: string,
    productId: string,
    brandId: string | undefined,
    quantity: number,
  ): Promise<StockBalance> {
    const brandFilter = brandId
      ? eq(stockBalanceModel.brandId, brandId)
      : isNull(stockBalanceModel.brandId)
    const [record] = await this.database
      .update(stockBalanceModel)
      .set({ quantity: String(quantity), updatedAt: new Date() })
      .where(
        and(
          eq(stockBalanceModel.productId, productId),
          brandFilter,
          this.productBelongsToEstablishment(productId, establishmentId),
        ),
      )
      .returning()
    if (!record) throw new ConflictError('Database operation conflicted')
    return this.toDomain(record)
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

  private productBelongsToEstablishment(productId: string, establishmentId: string) {
    return exists(
      this.database
        .select({ id: productModel.id })
        .from(productModel)
        .where(
          and(
            eq(productModel.id, productId),
            eq(productModel.establishmentId, establishmentId),
          ),
        ),
    )
  }

  private async hasProduct(productId: string, establishmentId: string): Promise<boolean> {
    const [record] = await this.database
      .select({ id: productModel.id })
      .from(productModel)
      .where(
        and(
          eq(productModel.id, productId),
          eq(productModel.establishmentId, establishmentId),
        ),
      )
      .limit(1)
    return record !== undefined
  }

  private toDomain(record: typeof stockBalanceModel.$inferSelect): StockBalance {
    return {
      productId: record.productId,
      brandId: record.brandId ?? undefined,
      quantity: Number(record.quantity),
      idealQuantity:
        record.idealQuantity === null ? undefined : Number(record.idealQuantity),
      situation: 'normal',
    }
  }
}
