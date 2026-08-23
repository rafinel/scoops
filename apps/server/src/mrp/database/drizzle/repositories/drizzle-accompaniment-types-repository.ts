import type { AccompanimentType } from '@scoops/core/mrp/domain/entities'
import type {
  AccompanimentTypeCreate,
  AccompanimentTypeListParams,
  AccompanimentTypePage,
  AccompanimentTypeUpdate,
} from '@scoops/core/mrp/domain/structures'
import type { AccompanimentTypesRepository } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { and, asc, count, eq, ilike, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleAccompanimentTypeMapper } from '../mappers/drizzle-accompaniment-type-mapper'
import { accompanimentTypeModel } from '../models/accompaniment-type-model'
import { productAccompanimentModel } from '../models/product-accompaniment-model'

@Injectable()
export class DrizzleAccompanimentTypesRepository
  extends DrizzleRepository
  implements AccompanimentTypesRepository
{
  async add(input: AccompanimentTypeCreate): Promise<AccompanimentType> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(accompanimentTypeModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          name: input.name,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return DrizzleAccompanimentTypeMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    typeId: string,
  ): Promise<AccompanimentType | undefined> {
    const [record] = await this.database
      .select()
      .from(accompanimentTypeModel)
      .where(
        and(
          eq(accompanimentTypeModel.establishmentId, establishmentId),
          eq(accompanimentTypeModel.id, typeId),
        ),
      )
      .limit(1)
    return record ? DrizzleAccompanimentTypeMapper.toDomain(record) : undefined
  }

  async findByName(
    establishmentId: string,
    name: string,
  ): Promise<AccompanimentType | undefined> {
    const [record] = await this.database
      .select()
      .from(accompanimentTypeModel)
      .where(
        and(
          eq(accompanimentTypeModel.establishmentId, establishmentId),
          sql`lower(${accompanimentTypeModel.name}) = lower(${name})`,
        ),
      )
      .limit(1)
    return record ? DrizzleAccompanimentTypeMapper.toDomain(record) : undefined
  }

  async findPage(input: AccompanimentTypeListParams): Promise<AccompanimentTypePage> {
    const tenantFilter = eq(accompanimentTypeModel.establishmentId, input.establishmentId)
    const searchFilter = input.search
      ? ilike(accompanimentTypeModel.name, `%${input.search}%`)
      : undefined
    const where = searchFilter ? and(tenantFilter, searchFilter) : tenantFilter
    const [records, totals] = await Promise.all([
      this.database
        .select({
          type: accompanimentTypeModel,
          usageCount: count(productAccompanimentModel.id),
        })
        .from(accompanimentTypeModel)
        .leftJoin(
          productAccompanimentModel,
          and(
            eq(productAccompanimentModel.accompanimentTypeId, accompanimentTypeModel.id),
            eq(productAccompanimentModel.establishmentId, input.establishmentId),
          ),
        )
        .where(where)
        .groupBy(
          accompanimentTypeModel.id,
          accompanimentTypeModel.establishmentId,
          accompanimentTypeModel.name,
          accompanimentTypeModel.createdAt,
          accompanimentTypeModel.updatedAt,
        )
        .orderBy(
          asc(sql`lower(${accompanimentTypeModel.name})`),
          asc(accompanimentTypeModel.id),
        )
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.select({ count: count() }).from(accompanimentTypeModel).where(where),
    ])
    const total = Number(totals[0]?.count ?? 0)
    const items = records.map(({ type, usageCount }) => ({
      type: DrizzleAccompanimentTypeMapper.toDomain(type),
      usageCount: Number(usageCount),
    }))

    return new PaginationResponse(
      items,
      input.page,
      input.pageSize,
      total,
      Math.ceil(total / input.pageSize),
    )
  }

  async replace(
    establishmentId: string,
    typeId: string,
    changes: AccompanimentTypeUpdate,
  ): Promise<AccompanimentType> {
    try {
      const [record] = await this.database
        .update(accompanimentTypeModel)
        .set({ name: changes.name, updatedAt: new Date() })
        .where(
          and(
            eq(accompanimentTypeModel.establishmentId, establishmentId),
            eq(accompanimentTypeModel.id, typeId),
          ),
        )
        .returning()
      return DrizzleAccompanimentTypeMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(establishmentId: string, typeId: string): Promise<void> {
    try {
      await this.database
        .delete(accompanimentTypeModel)
        .where(
          and(
            eq(accompanimentTypeModel.establishmentId, establishmentId),
            eq(accompanimentTypeModel.id, typeId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
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
