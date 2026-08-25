import type { ResaleConfiguration } from '@scoops/core/mrp/domain/entities'
import type {
  ResaleConfigurationCreate,
  ResaleConfigurationUpdate,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { ResaleConfigurationsRepository } from '@scoops/core/mrp/interfaces'
import { and, asc, count, eq, isNull } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleResaleConfigurationMapper } from '@/mrp/database/drizzle/mappers/drizzle-resale-configuration-mapper'
import { resaleConfigurationModel } from '@/mrp/database/drizzle/models/resale-configuration-model'

@Injectable()
export class DrizzleResaleConfigurationsRepository
  extends DrizzleRepository
  implements ResaleConfigurationsRepository
{
  async add(input: ResaleConfigurationCreate): Promise<ResaleConfiguration> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(resaleConfigurationModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          productId: input.productId,
          brandId: input.brandId ?? null,
          price: String(input.price),
          isActive: input.isActive,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return DrizzleResaleConfigurationMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    productId: string,
    configurationId: string,
  ): Promise<ResaleConfiguration | undefined> {
    const [record] = await this.database
      .select()
      .from(resaleConfigurationModel)
      .where(
        and(
          eq(resaleConfigurationModel.establishmentId, establishmentId),
          eq(resaleConfigurationModel.productId, productId),
          eq(resaleConfigurationModel.id, configurationId),
        ),
      )
      .limit(1)
    return record ? DrizzleResaleConfigurationMapper.toDomain(record) : undefined
  }

  async findByProductAndBrand(
    establishmentId: string,
    productId: string,
    brandId?: string,
  ): Promise<ResaleConfiguration | undefined> {
    const brandFilter = brandId
      ? eq(resaleConfigurationModel.brandId, brandId)
      : isNull(resaleConfigurationModel.brandId)
    const [record] = await this.database
      .select()
      .from(resaleConfigurationModel)
      .where(
        and(
          eq(resaleConfigurationModel.establishmentId, establishmentId),
          eq(resaleConfigurationModel.productId, productId),
          brandFilter,
        ),
      )
      .limit(1)
    return record ? DrizzleResaleConfigurationMapper.toDomain(record) : undefined
  }

  async findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ResaleConfiguration[]> {
    const records = await this.database
      .select()
      .from(resaleConfigurationModel)
      .where(
        and(
          eq(resaleConfigurationModel.establishmentId, establishmentId),
          eq(resaleConfigurationModel.productId, productId),
        ),
      )
      .orderBy(asc(resaleConfigurationModel.id))
    return records.map(DrizzleResaleConfigurationMapper.toDomain)
  }

  async countByProductId(establishmentId: string, productId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(resaleConfigurationModel)
      .where(
        and(
          eq(resaleConfigurationModel.establishmentId, establishmentId),
          eq(resaleConfigurationModel.productId, productId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replace(
    establishmentId: string,
    productId: string,
    configurationId: string,
    changes: ResaleConfigurationUpdate,
  ): Promise<ResaleConfiguration> {
    try {
      const [record] = await this.database
        .update(resaleConfigurationModel)
        .set({
          price: String(changes.price),
          isActive: changes.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(resaleConfigurationModel.establishmentId, establishmentId),
            eq(resaleConfigurationModel.productId, productId),
            eq(resaleConfigurationModel.id, configurationId),
          ),
        )
        .returning()
      return DrizzleResaleConfigurationMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeByProductId(establishmentId: string, productId: string): Promise<void> {
    try {
      await this.database
        .delete(resaleConfigurationModel)
        .where(
          and(
            eq(resaleConfigurationModel.establishmentId, establishmentId),
            eq(resaleConfigurationModel.productId, productId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(resaleConfigurationModel)
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
