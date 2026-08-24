import type { ProductSize } from '@scoops/core/mrp/domain/entities'
import type {
  ProductSizeCreate,
  ProductSizeUpdate,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { ProductSizesRepository } from '@scoops/core/mrp/interfaces'
import { and, asc, count, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleProductSizeMapper } from '@/mrp/database/drizzle/mappers/drizzle-product-size-mapper'
import { productSizeModel } from '@/mrp/database/drizzle/models/product-size-model'

@Injectable()
export class DrizzleProductSizesRepository
  extends DrizzleRepository
  implements ProductSizesRepository
{
  async add(input: ProductSizeCreate): Promise<ProductSize> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(productSizeModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          productId: input.productId,
          name: input.name,
          quantity: String(input.quantity),
          price: String(input.price),
          isActive: input.isActive,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return DrizzleProductSizeMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    productId: string,
    sizeId: string,
  ): Promise<ProductSize | undefined> {
    const [record] = await this.database
      .select()
      .from(productSizeModel)
      .where(
        and(
          eq(productSizeModel.establishmentId, establishmentId),
          eq(productSizeModel.productId, productId),
          eq(productSizeModel.id, sizeId),
        ),
      )
      .limit(1)
    return record ? DrizzleProductSizeMapper.toDomain(record) : undefined
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ProductSize[]> {
    const records = await this.database
      .select()
      .from(productSizeModel)
      .where(
        and(
          eq(productSizeModel.establishmentId, establishmentId),
          eq(productSizeModel.productId, productId),
        ),
      )
      .orderBy(asc(productSizeModel.name), asc(productSizeModel.id))
    return records.map(DrizzleProductSizeMapper.toDomain)
  }

  async countActive(establishmentId: string, productId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(productSizeModel)
      .where(
        and(
          eq(productSizeModel.establishmentId, establishmentId),
          eq(productSizeModel.productId, productId),
          eq(productSizeModel.isActive, true),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replace(
    establishmentId: string,
    productId: string,
    sizeId: string,
    changes: ProductSizeUpdate,
  ): Promise<ProductSize> {
    try {
      const [record] = await this.database
        .update(productSizeModel)
        .set({
          name: changes.name,
          quantity: changes.quantity === undefined ? undefined : String(changes.quantity),
          price: changes.price === undefined ? undefined : String(changes.price),
          isActive: changes.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productSizeModel.establishmentId, establishmentId),
            eq(productSizeModel.productId, productId),
            eq(productSizeModel.id, sizeId),
          ),
        )
        .returning()
      return DrizzleProductSizeMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(
    establishmentId: string,
    productId: string,
    sizeId: string,
  ): Promise<void> {
    try {
      await this.database
        .delete(productSizeModel)
        .where(
          and(
            eq(productSizeModel.establishmentId, establishmentId),
            eq(productSizeModel.productId, productId),
            eq(productSizeModel.id, sizeId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(productSizeModel)
  }

  private toConflictError(error: unknown): unknown {
    if (this.isIntegrityConstraintError(error)) {
      return new ConflictError('Database operation conflicted')
    }
    return error
  }

  private isIntegrityConstraintError(error: unknown): boolean {
    let currentError: unknown = error
    while (currentError && typeof currentError === 'object') {
      if (
        'code' in currentError &&
        (currentError.code === '23505' ||
          currentError.code === '23503' ||
          currentError.code === '23514')
      ) {
        return true
      }
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }
}
