import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import {
  ProductStockSituation,
  ProductSortDirection,
  ProductSortField,
  type ProductCatalogPage,
} from '@scoops/core/mrp/domain/structures'
import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductListParams } from '@scoops/core/mrp/domain/structures'
import type { ProductCreate, ProductUpdate } from '@scoops/core/mrp/domain/structures'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  sql,
} from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleProductMapper } from '../mappers/drizzle-product-mapper'
import { productAccompanimentModel } from '../models/product-accompaniment-model'
import { productBrandModel } from '../models/product-brand-model'
import { productModel } from '../models/product-model'
import { stockBalanceModel } from '../models/stock-balance-model'

@Injectable()
export class DrizzleProductsRepository
  extends DrizzleRepository
  implements ProductsRepository
{
  async add(input: ProductCreate): Promise<Product> {
    const now = new Date()
    const [record] = await this.database
      .insert(productModel)
      .values({
        ...input,
        id: crypto.randomUUID(),
        categories: [...input.categories],
        idealStock: this.toNumericValue(input.idealStock) ?? null,
        currentUnitCost: this.toNumericValue(input.currentUnitCost) ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return DrizzleProductMapper.toDomain(record)
  }

  async addMany(inputs: ProductCreate[]): Promise<readonly Product[]> {
    if (inputs.length === 0) return []
    const now = new Date()
    const records = await this.database
      .insert(productModel)
      .values(
        inputs.map((input) => ({
          ...input,
          id: crypto.randomUUID(),
          categories: [...input.categories],
          idealStock: this.toNumericValue(input.idealStock) ?? null,
          currentUnitCost: this.toNumericValue(input.currentUnitCost) ?? null,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .returning()
    return records.map(DrizzleProductMapper.toDomain)
  }

  async findById(establishmentId: string, productId: string) {
    const [record] = await this.database
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.establishmentId, establishmentId),
          eq(productModel.id, productId),
        ),
      )
      .limit(1)
    return record ? DrizzleProductMapper.toDomain(record) : undefined
  }

  async findByName(establishmentId: string, name: string) {
    const [record] = await this.database
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.establishmentId, establishmentId),
          sql`lower(${productModel.name}) = lower(${name})`,
        ),
      )
      .limit(1)
    return record ? DrizzleProductMapper.toDomain(record) : undefined
  }

  async findManyByIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly Product[]> {
    if (productIds.length === 0) return []
    const records = await this.database
      .select()
      .from(productModel)
      .where(
        and(
          eq(productModel.establishmentId, establishmentId),
          inArray(productModel.id, [...new Set(productIds)].slice(0, 500)),
        ),
      )
    return records.map(DrizzleProductMapper.toDomain)
  }

  async findMany(input: ProductListParams): Promise<ProductCatalogPage> {
    const stockTotals = this.database
      .select({
        productId: stockBalanceModel.productId,
        stockQuantity: sql<number>`coalesce(sum(${stockBalanceModel.quantity}), 0)`.as(
          'stock_quantity',
        ),
      })
      .from(stockBalanceModel)
      .groupBy(stockBalanceModel.productId)
      .as('stock_totals')
    const brandTotals = this.database
      .select({
        productId: productBrandModel.productId,
        brandCount: count(productBrandModel.id).as('brand_count'),
      })
      .from(productBrandModel)
      .groupBy(productBrandModel.productId)
      .as('brand_totals')
    const establishmentFilter = eq(productModel.establishmentId, input.establishmentId)
    const filters = [establishmentFilter]
    if (input.search)
      filters.push(ilike(productModel.name, `%${escapeLikePattern(input.search)}%`))
    if (input.status) filters.push(eq(productModel.status, input.status))
    if (input.categories?.length)
      filters.push(arrayOverlaps(productModel.categories, [...input.categories]))
    if (input.usedAsAccompanimentId) {
      filters.push(
        exists(
          this.database
            .select({ id: productAccompanimentModel.id })
            .from(productAccompanimentModel)
            .where(
              and(
                eq(productAccompanimentModel.establishmentId, input.establishmentId),
                eq(productAccompanimentModel.productId, productModel.id),
                eq(
                  productAccompanimentModel.accompanimentProductId,
                  input.usedAsAccompanimentId,
                ),
              ),
            ),
        ),
      )
    }
    if (input.stockSituation === ProductStockSituation.Low) {
      filters.push(
        sql`${productModel.idealStock} is not null and coalesce(${stockTotals.stockQuantity}, 0) < ${productModel.idealStock}`,
      )
    }
    if (input.stockSituation === ProductStockSituation.Normal) {
      filters.push(
        sql`${productModel.idealStock} is null or coalesce(${stockTotals.stockQuantity}, 0) >= ${productModel.idealStock}`,
      )
    }
    const sortColumns = {
      [ProductSortField.Name]: productModel.name,
      [ProductSortField.StockQuantity]: stockTotals.stockQuantity,
      [ProductSortField.BrandCount]: brandTotals.brandCount,
      [ProductSortField.Categories]: productModel.categories,
      [ProductSortField.Unit]: productModel.unit,
    }
    const sortColumn = input.sortBy
      ? (sortColumns[input.sortBy] ?? productModel.createdAt)
      : productModel.createdAt
    const order = input.sortDirection === ProductSortDirection.Ascending ? asc : desc
    const [records, totals, kpiRows] = await Promise.all([
      this.database
        .select({
          product: productModel,
          brandCount: sql<number>`coalesce(${brandTotals.brandCount}, 0)`,
          stockQuantity: sql<number>`coalesce(${stockTotals.stockQuantity}, 0)`,
        })
        .from(productModel)
        .leftJoin(stockTotals, eq(stockTotals.productId, productModel.id))
        .leftJoin(brandTotals, eq(brandTotals.productId, productModel.id))
        .where(and(...filters))
        .orderBy(order(sortColumn), order(productModel.id))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database
        .select({ count: count() })
        .from(productModel)
        .leftJoin(stockTotals, eq(stockTotals.productId, productModel.id))
        .where(and(...filters)),
      this.database
        .select({
          products: count(productModel.id),
          brands: sql<number>`coalesce(sum(coalesce(${brandTotals.brandCount}, 0)), 0)`,
          lowStock: sql<number>`count(*) filter (where ${productModel.idealStock} is not null and coalesce(${stockTotals.stockQuantity}, 0) < ${productModel.idealStock})`,
        })
        .from(productModel)
        .leftJoin(stockTotals, eq(stockTotals.productId, productModel.id))
        .leftJoin(brandTotals, eq(brandTotals.productId, productModel.id))
        .where(establishmentFilter),
    ])
    const total = Number(totals[0]?.count ?? 0)
    const items = records.map(({ product: record, brandCount, stockQuantity }) => ({
      product: DrizzleProductMapper.toDomain(record),
      brandCount: Number(brandCount ?? 0),
      stockQuantity: Number(stockQuantity ?? 0),
      idealStock: record.idealStock === null ? undefined : Number(record.idealStock),
      stockSituation:
        record.idealStock !== null &&
        Number(stockQuantity ?? 0) < Number(record.idealStock)
          ? ProductStockSituation.Low
          : ProductStockSituation.Normal,
    }))
    const kpis = kpiRows[0]
    return Object.assign(
      new PaginationResponse(
        items,
        input.page,
        input.pageSize,
        total,
        Math.ceil(total / input.pageSize),
      ),
      {
        kpis: {
          products: Number(kpis?.products ?? 0),
          brands: Number(kpis?.brands ?? 0),
          lowStock: Number(kpis?.lowStock ?? 0),
        },
      },
    )
  }

  async findByIdForUpdate(
    establishmentId: string,
    productId: string,
  ): Promise<Product | undefined> {
    const [record] = await this.findProductByIdentity(establishmentId, productId)
      .for('update')
      .limit(1)
    return record ? DrizzleProductMapper.toDomain(record) : undefined
  }

  async replace(
    establishmentId: string,
    productId: string,
    changes: ProductUpdate,
  ): Promise<Product>
  async replace(productId: string, changes: ProductUpdate): Promise<Product>
  async replace(
    establishmentOrProductId: string,
    productIdOrChanges: string | ProductUpdate,
    scopedChanges?: ProductUpdate,
  ): Promise<Product> {
    return this.replaceProductRecord(
      resolveProductUpdate(establishmentOrProductId, productIdOrChanges, scopedChanges),
    )
  }

  async remove(establishmentId: string, productId: string): Promise<void>
  async remove(productId: string): Promise<void>
  async remove(
    establishmentOrProductId: string,
    scopedProductId?: string,
  ): Promise<void> {
    const { establishmentId, productId } = resolveProductRemoval(
      establishmentOrProductId,
      scopedProductId,
    )
    const deleted = await this.removeProductRecord(establishmentId, productId)
    if (!deleted.length)
      throw new ConflictError('A operação no banco de dados entrou em conflito.')
  }

  async removeAll() {
    await this.database.delete(productModel)
  }

  private toNumericValue(value: number | null | undefined): string | null | undefined {
    if (value === undefined || value === null) return value
    return String(value)
  }

  private async replaceProductRecord(
    input: ReturnType<typeof resolveProductUpdate>,
  ): Promise<Product> {
    const [record] = await this.updateProductRecord(input)
    return requireProductRecord(record)
  }

  private updateProductRecord(input: ReturnType<typeof resolveProductUpdate>) {
    return this.database
      .update(productModel)
      .set(toProductUpdatePersistence(input.changes, this.toNumericValue.bind(this)))
      .where(productIdentityFilter(input.establishmentId, input.productId))
      .returning()
  }

  private findProductByIdentity(establishmentId: string, productId: string) {
    return this.database
      .select()
      .from(productModel)
      .where(productIdentityFilter(establishmentId, productId))
  }

  private removeProductRecord(establishmentId: string | undefined, productId: string) {
    return this.database
      .delete(productModel)
      .where(productIdentityFilter(establishmentId, productId))
      .returning({ id: productModel.id })
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

function productIdentityFilter(establishmentId: string | undefined, productId: string) {
  const productIdFilter = eq(productModel.id, productId)
  return establishmentId !== undefined
    ? and(eq(productModel.establishmentId, establishmentId), productIdFilter)
    : productIdFilter
}

function resolveProductUpdate(
  establishmentOrProductId: string,
  productIdOrChanges: string | ProductUpdate,
  scopedChanges?: ProductUpdate,
): { establishmentId?: string; productId: string; changes: ProductUpdate } {
  return typeof productIdOrChanges === 'string'
    ? scopedProductUpdate(establishmentOrProductId, productIdOrChanges, scopedChanges)
    : { productId: establishmentOrProductId, changes: productIdOrChanges }
}

function scopedProductUpdate(
  establishmentId: string,
  productId: string,
  changes?: ProductUpdate,
): { establishmentId: string; productId: string; changes: ProductUpdate } {
  if (!changes)
    throw new ConflictError('A operação no banco de dados entrou em conflito.')
  return { establishmentId, productId, changes }
}

function resolveProductRemoval(
  establishmentOrProductId: string,
  scopedProductId?: string,
): { establishmentId?: string; productId: string } {
  return scopedProductId !== undefined
    ? { establishmentId: establishmentOrProductId, productId: scopedProductId }
    : { productId: establishmentOrProductId }
}

function toProductUpdatePersistence(
  changes: ProductUpdate,
  toNumericValue: (value: number | null | undefined) => string | null | undefined,
) {
  return {
    ...changes,
    categories: changes.categories && [...changes.categories],
    ...toNumericStockValues(changes, toNumericValue),
    internalNotes: changes.internalNotes,
    updatedAt: new Date(),
  }
}

function toNumericStockValues(
  changes: ProductUpdate,
  toNumericValue: (value: number | null | undefined) => string | null | undefined,
) {
  return {
    idealStock: toNumericValue(changes.idealStock),
    currentUnitCost: toNumericValue(changes.currentUnitCost),
  }
}

function requireProductRecord(
  record: Parameters<typeof DrizzleProductMapper.toDomain>[0] | undefined,
): Product {
  if (!record) throw new ConflictError('A operação no banco de dados entrou em conflito.')
  return DrizzleProductMapper.toDomain(record)
}
