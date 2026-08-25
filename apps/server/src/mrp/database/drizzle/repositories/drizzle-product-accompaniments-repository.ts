import type { ProductAccompaniment } from '@scoops/core/mrp/domain/entities'
import type {
  ProductAccompanimentCreate,
  ProductAccompanimentUpdate,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { ProductAccompanimentsRepository } from '@scoops/core/mrp/interfaces'
import { and, asc, count, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleProductAccompanimentMapper } from '../mappers/drizzle-product-accompaniment-mapper'
import { productAccompanimentModel } from '../models/product-accompaniment-model'

@Injectable()
export class DrizzleProductAccompanimentsRepository
  extends DrizzleRepository
  implements ProductAccompanimentsRepository
{
  async add(input: ProductAccompanimentCreate): Promise<ProductAccompaniment> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(productAccompanimentModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          productId: input.productId,
          accompanimentProductId: input.accompanimentProductId,
          accompanimentTypeId: input.accompanimentTypeId,
          quantityPerPortion: String(input.quantityPerPortion),
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return DrizzleProductAccompanimentMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async countByTypeId(establishmentId: string, typeId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.accompanimentTypeId, typeId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async findById(
    establishmentId: string,
    productId: string,
    linkId: string,
  ): Promise<ProductAccompaniment | undefined> {
    const [record] = await this.database
      .select()
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.productId, productId),
          eq(productAccompanimentModel.id, linkId),
        ),
      )
      .limit(1)
    return record ? DrizzleProductAccompanimentMapper.toDomain(record) : undefined
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ProductAccompaniment[]> {
    const records = await this.database
      .select()
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.productId, productId),
        ),
      )
      .orderBy(asc(productAccompanimentModel.id))
    return records.map(DrizzleProductAccompanimentMapper.toDomain)
  }

  async countByProductId(establishmentId: string, productId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.productId, productId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async findManyByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<readonly ProductAccompaniment[]> {
    const records = await this.database
      .select()
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.accompanimentProductId, accompanimentProductId),
        ),
      )
      .orderBy(asc(productAccompanimentModel.id))
    return records.map(DrizzleProductAccompanimentMapper.toDomain)
  }

  async countByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.accompanimentProductId, accompanimentProductId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replaceQuantitiesByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
    quantities: readonly { linkId: string; quantityPerPortion: number }[],
  ): Promise<void> {
    for (const { linkId, quantityPerPortion } of quantities) {
      const records = await this.database
        .update(productAccompanimentModel)
        .set({ quantityPerPortion: String(quantityPerPortion), updatedAt: new Date() })
        .where(
          and(
            eq(productAccompanimentModel.establishmentId, establishmentId),
            eq(productAccompanimentModel.accompanimentProductId, accompanimentProductId),
            eq(productAccompanimentModel.id, linkId),
          ),
        )
        .returning({ id: productAccompanimentModel.id })
      if (records.length !== 1) throw new ConflictError('Database operation conflicted')
    }
  }

  async removeByProductId(establishmentId: string, productId: string): Promise<void> {
    try {
      await this.database
        .delete(productAccompanimentModel)
        .where(
          and(
            eq(productAccompanimentModel.establishmentId, establishmentId),
            eq(productAccompanimentModel.productId, productId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<void> {
    try {
      await this.database
        .delete(productAccompanimentModel)
        .where(
          and(
            eq(productAccompanimentModel.establishmentId, establishmentId),
            eq(productAccompanimentModel.accompanimentProductId, accompanimentProductId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findByProductAndAccompaniment(
    establishmentId: string,
    productId: string,
    accompanimentProductId: string,
  ): Promise<ProductAccompaniment | undefined> {
    const [record] = await this.database
      .select()
      .from(productAccompanimentModel)
      .where(
        and(
          eq(productAccompanimentModel.establishmentId, establishmentId),
          eq(productAccompanimentModel.productId, productId),
          eq(productAccompanimentModel.accompanimentProductId, accompanimentProductId),
        ),
      )
      .limit(1)
    return record ? DrizzleProductAccompanimentMapper.toDomain(record) : undefined
  }

  async replace(
    establishmentId: string,
    productId: string,
    linkId: string,
    changes: ProductAccompanimentUpdate,
  ): Promise<ProductAccompaniment> {
    try {
      const [record] = await this.database
        .update(productAccompanimentModel)
        .set({
          accompanimentTypeId: changes.accompanimentTypeId,
          quantityPerPortion: String(changes.quantityPerPortion),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productAccompanimentModel.establishmentId, establishmentId),
            eq(productAccompanimentModel.productId, productId),
            eq(productAccompanimentModel.id, linkId),
          ),
        )
        .returning()
      return DrizzleProductAccompanimentMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(
    establishmentId: string,
    productId: string,
    linkId: string,
  ): Promise<void> {
    try {
      const records = await this.database
        .delete(productAccompanimentModel)
        .where(
          and(
            eq(productAccompanimentModel.establishmentId, establishmentId),
            eq(productAccompanimentModel.productId, productId),
            eq(productAccompanimentModel.id, linkId),
          ),
        )
        .returning({ id: productAccompanimentModel.id })
      if (!records.length) throw new ConflictError('Database operation conflicted')
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(productAccompanimentModel)
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
