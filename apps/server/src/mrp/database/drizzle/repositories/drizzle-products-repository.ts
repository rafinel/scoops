import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import {
  ProductStockSituation,
  ProductSortDirection,
  ProductSortField,
  type ProductCatalogPage,
} from '@scoops/core/mrp/domain/structures'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from '@scoops/core/mrp/domain/entities'
import type { ProductListParams } from '@scoops/core/mrp/domain/structures'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { and, arrayOverlaps, asc, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleProductMapper } from '../mappers/drizzle-product-mapper'
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
        idealStock: input.idealStock === undefined ? null : String(input.idealStock),
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
          idealStock: input.idealStock === undefined ? null : String(input.idealStock),
          createdAt: now,
          updatedAt: now,
        })),
      )
      .returning()
    return records.map(DrizzleProductMapper.toDomain)
  }

  async findById(productId: string) {
    const [record] = await this.database
      .select()
      .from(productModel)
      .where(eq(productModel.id, productId))
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
    if (input.search) filters.push(ilike(productModel.name, `%${input.search}%`))
    if (input.status) filters.push(eq(productModel.status, input.status))
    if (input.categories?.length)
      filters.push(arrayOverlaps(productModel.categories, [...input.categories]))
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
    const sortColumn = (() => {
      switch (input.sortBy) {
        case ProductSortField.Name:
          return productModel.name
        case ProductSortField.StockQuantity:
          return stockTotals.stockQuantity
        case ProductSortField.BrandCount:
          return brandTotals.brandCount
        case ProductSortField.Categories:
          return productModel.categories
        case ProductSortField.Unit:
          return productModel.unit
        default:
          return productModel.createdAt
      }
    })()
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
        .where(and(...filters)),
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

  async replace(productId: string, changes: ProductUpdate) {
    const [record] = await this.database
      .update(productModel)
      .set({
        ...changes,
        categories: changes.categories ? [...changes.categories] : undefined,
        idealStock:
          changes.idealStock === undefined ? undefined : String(changes.idealStock),
        updatedAt: new Date(),
      })
      .where(eq(productModel.id, productId))
      .returning()
    return DrizzleProductMapper.toDomain(record)
  }

  async remove(productId: string) {
    await this.database.delete(productModel).where(eq(productModel.id, productId))
  }

  async removeAll() {
    await this.database.delete(productModel)
  }
}
