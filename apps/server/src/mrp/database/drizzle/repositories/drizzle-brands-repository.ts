import type { Brand, BrandCreate, BrandUpdate } from '@scoops/core/mrp/domain/entities'
import type { BrandsRepository } from '@scoops/core/mrp/interfaces'
import { and, asc, count, eq, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleBrandMapper } from '../mappers/drizzle-brand-mapper'
import { productBrandModel } from '../models/product-brand-model'

@Injectable()
export class DrizzleBrandsRepository
  extends DrizzleRepository
  implements BrandsRepository
{
  async add(input: BrandCreate): Promise<Brand> {
    const now = new Date()
    const [record] = await this.database
      .insert(productBrandModel)
      .values({
        id: crypto.randomUUID(),
        productId: input.productId,
        name: input.name,
        packageQuantity: String(input.packageQuantity),
        packageValue: String(input.packagePrice),
        isPrimary: input.isPrimary,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return DrizzleBrandMapper.toDomain(record)
  }

  async countByProductId(productId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(productBrandModel)
      .where(eq(productBrandModel.productId, productId))
    return Number(record?.count ?? 0)
  }

  async findById(productId: string, brandId: string) {
    const [record] = await this.database
      .select()
      .from(productBrandModel)
      .where(
        and(
          eq(productBrandModel.productId, productId),
          eq(productBrandModel.id, brandId),
        ),
      )
      .limit(1)
    return record ? DrizzleBrandMapper.toDomain(record) : undefined
  }

  async findByName(productId: string, name: string) {
    const [record] = await this.database
      .select()
      .from(productBrandModel)
      .where(
        and(
          eq(productBrandModel.productId, productId),
          sql`lower(${productBrandModel.name}) = lower(${name})`,
        ),
      )
      .limit(1)
    return record ? DrizzleBrandMapper.toDomain(record) : undefined
  }

  async findManyByProductId(productId: string) {
    const records = await this.database
      .select()
      .from(productBrandModel)
      .where(eq(productBrandModel.productId, productId))
      .orderBy(asc(productBrandModel.name))
    return records.map(DrizzleBrandMapper.toDomain)
  }

  async replace(productId: string, brandId: string, changes: BrandUpdate) {
    const [record] = await this.database
      .update(productBrandModel)
      .set({
        name: changes.name,
        packageQuantity:
          changes.packageQuantity === undefined
            ? undefined
            : String(changes.packageQuantity),
        packageValue:
          changes.packagePrice === undefined ? undefined : String(changes.packagePrice),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productBrandModel.productId, productId),
          eq(productBrandModel.id, brandId),
        ),
      )
      .returning()
    return DrizzleBrandMapper.toDomain(record)
  }

  async setPrimary(productId: string, brandId: string) {
    await this.database
      .update(productBrandModel)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(productBrandModel.productId, productId))
    const [record] = await this.database
      .update(productBrandModel)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(
        and(
          eq(productBrandModel.productId, productId),
          eq(productBrandModel.id, brandId),
        ),
      )
      .returning()
    return DrizzleBrandMapper.toDomain(record)
  }

  async remove(productId: string, brandId: string) {
    await this.database
      .delete(productBrandModel)
      .where(
        and(
          eq(productBrandModel.productId, productId),
          eq(productBrandModel.id, brandId),
        ),
      )
  }
}
