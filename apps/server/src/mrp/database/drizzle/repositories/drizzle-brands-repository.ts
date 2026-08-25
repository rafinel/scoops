import type { Brand, BrandCreate, BrandUpdate } from '@scoops/core/mrp/domain/entities'
import type { BrandsRepository } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { and, asc, count, eq, exists, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleBrandMapper } from '../mappers/drizzle-brand-mapper'
import { productBrandModel } from '../models/product-brand-model'
import { productModel } from '../models/product-model'

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
        unit: input.unit ?? 'un',
        packageQuantity: String(input.packageQuantity),
        packageValue: String(input.packagePrice),
        isPrimary: input.isPrimary,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return DrizzleBrandMapper.toDomain(record)
  }

  async countByProductId(establishmentId: string, productId: string): Promise<number>
  async countByProductId(productId: string): Promise<number>
  async countByProductId(
    establishmentOrProductId: string,
    scopedProductId?: string,
  ): Promise<number> {
    const productId = scopedProductId ?? establishmentOrProductId
    const filters = [eq(productBrandModel.productId, productId)]
    if (scopedProductId) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const [record] = await this.database
      .select({ count: count() })
      .from(productBrandModel)
      .where(and(...filters))
    return Number(record?.count ?? 0)
  }

  async findById(
    establishmentId: string,
    productId: string,
    brandId: string,
  ): Promise<Brand | undefined>
  async findById(productId: string, brandId: string): Promise<Brand | undefined>
  async findById(
    establishmentOrProductId: string,
    productIdOrBrandId: string,
    scopedBrandId?: string,
  ): Promise<Brand | undefined> {
    const isScoped = scopedBrandId !== undefined
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = scopedBrandId ?? productIdOrBrandId
    const filters = [
      eq(productBrandModel.productId, productId),
      eq(productBrandModel.id, brandId),
    ]
    if (isScoped) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const [record] = await this.database
      .select()
      .from(productBrandModel)
      .where(and(...filters))
      .limit(1)
    return record ? DrizzleBrandMapper.toDomain(record) : undefined
  }

  async findByName(
    establishmentId: string,
    productId: string,
    name: string,
  ): Promise<Brand | undefined>
  async findByName(productId: string, name: string): Promise<Brand | undefined>
  async findByName(
    establishmentOrProductId: string,
    productIdOrName: string,
    scopedName?: string,
  ): Promise<Brand | undefined> {
    const isScoped = scopedName !== undefined
    const productId = isScoped ? productIdOrName : establishmentOrProductId
    const name = scopedName ?? productIdOrName
    const filters = [
      eq(productBrandModel.productId, productId),
      sql`lower(${productBrandModel.name}) = lower(${name})`,
    ]
    if (isScoped) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const [record] = await this.database
      .select()
      .from(productBrandModel)
      .where(and(...filters))
      .limit(1)
    return record ? DrizzleBrandMapper.toDomain(record) : undefined
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly Brand[]>
  async findManyByProductId(productId: string): Promise<readonly Brand[]>
  async findManyByProductId(
    establishmentOrProductId: string,
    scopedProductId?: string,
  ): Promise<readonly Brand[]> {
    const productId = scopedProductId ?? establishmentOrProductId
    const filters = [eq(productBrandModel.productId, productId)]
    if (scopedProductId) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const records = await this.database
      .select()
      .from(productBrandModel)
      .where(and(...filters))
      .orderBy(asc(productBrandModel.name))
    return records.map(DrizzleBrandMapper.toDomain)
  }

  async replace(
    establishmentId: string,
    productId: string,
    brandId: string,
    changes: BrandUpdate,
  ): Promise<Brand>
  async replace(productId: string, brandId: string, changes: BrandUpdate): Promise<Brand>
  async replace(
    establishmentOrProductId: string,
    productIdOrBrandId: string,
    brandIdOrChanges: string | BrandUpdate,
    scopedChanges?: BrandUpdate,
  ): Promise<Brand> {
    const isScoped = typeof brandIdOrChanges === 'string'
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = isScoped ? brandIdOrChanges : productIdOrBrandId
    const changes = isScoped ? scopedChanges : brandIdOrChanges
    if (!changes || typeof changes === 'string')
      throw new ConflictError('Database operation conflicted')

    const filters = [
      eq(productBrandModel.productId, productId),
      eq(productBrandModel.id, brandId),
    ]
    if (isScoped) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const [record] = await this.database
      .update(productBrandModel)
      .set({
        name: changes.name,
        unit: changes.unit,
        packageQuantity:
          changes.packageQuantity === undefined
            ? undefined
            : String(changes.packageQuantity),
        packageValue:
          changes.packagePrice === undefined ? undefined : String(changes.packagePrice),
        updatedAt: new Date(),
      })
      .where(and(...filters))
      .returning()
    if (!record) throw new ConflictError('Database operation conflicted')
    return DrizzleBrandMapper.toDomain(record)
  }

  async setPrimary(
    establishmentId: string,
    productId: string,
    brandId: string,
  ): Promise<Brand>
  async setPrimary(productId: string, brandId: string): Promise<Brand>
  async setPrimary(
    establishmentOrProductId: string,
    productIdOrBrandId: string,
    scopedBrandId?: string,
  ): Promise<Brand> {
    const isScoped = scopedBrandId !== undefined
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = scopedBrandId ?? productIdOrBrandId
    const productFilters = [eq(productBrandModel.productId, productId)]
    if (isScoped) {
      productFilters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    await this.database
      .update(productBrandModel)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(and(...productFilters))
    const [record] = await this.database
      .update(productBrandModel)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(and(...productFilters, eq(productBrandModel.id, brandId)))
      .returning()
    if (!record) throw new ConflictError('Database operation conflicted')
    return DrizzleBrandMapper.toDomain(record)
  }

  async remove(establishmentId: string, productId: string, brandId: string): Promise<void>
  async remove(productId: string, brandId: string): Promise<void>
  async remove(
    establishmentOrProductId: string,
    productIdOrBrandId: string,
    scopedBrandId?: string,
  ): Promise<void> {
    const isScoped = scopedBrandId !== undefined
    const productId = isScoped ? productIdOrBrandId : establishmentOrProductId
    const brandId = scopedBrandId ?? productIdOrBrandId
    const filters = [
      eq(productBrandModel.productId, productId),
      eq(productBrandModel.id, brandId),
    ]
    if (isScoped) {
      filters.push(
        this.productBelongsToEstablishment(productId, establishmentOrProductId),
      )
    }
    const records = await this.database
      .delete(productBrandModel)
      .where(and(...filters))
      .returning({ id: productBrandModel.id })
    if (!records.length) throw new ConflictError('Database operation conflicted')
  }

  async removeAll(): Promise<void> {
    await this.database.delete(productBrandModel)
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
}
