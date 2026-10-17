import type { GlobalAccompaniment } from '@scoops/core/mrp/domain/entities'
import type {
  GlobalAccompanimentCreate,
  GlobalAccompanimentUpdate,
} from '@scoops/core/mrp/domain/structures'
import type { GlobalAccompanimentsRepository } from '@scoops/core/mrp/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { and, asc, count, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleGlobalAccompanimentMapper } from '../mappers/drizzle-global-accompaniment-mapper'
import { globalAccompanimentModel } from '../models/global-accompaniment-model'

@Injectable()
export class DrizzleGlobalAccompanimentsRepository
  extends DrizzleRepository
  implements GlobalAccompanimentsRepository
{
  async add(input: GlobalAccompanimentCreate): Promise<GlobalAccompaniment> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(globalAccompanimentModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          accompanimentProductId: input.accompanimentProductId,
          accompanimentTypeId: input.accompanimentTypeId,
          quantityPerPortion: String(input.quantityPerPortion),
          createdAt: now,
          updatedAt: now,
        })
        .returning()
      return DrizzleGlobalAccompanimentMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async addMany(
    inputs: readonly GlobalAccompanimentCreate[],
  ): Promise<GlobalAccompaniment[]> {
    if (inputs.length === 0) return []
    try {
      const now = new Date()
      const records = await this.database
        .insert(globalAccompanimentModel)
        .values(
          inputs.map((input) => ({
            id: crypto.randomUUID(),
            establishmentId: input.establishmentId,
            accompanimentProductId: input.accompanimentProductId,
            accompanimentTypeId: input.accompanimentTypeId,
            quantityPerPortion: String(input.quantityPerPortion),
            createdAt: now,
            updatedAt: now,
          })),
        )
        .returning()
      return records.map(DrizzleGlobalAccompanimentMapper.toDomain)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    globalAccompanimentId: string,
  ): Promise<GlobalAccompaniment | undefined> {
    const [record] = await this.database
      .select()
      .from(globalAccompanimentModel)
      .where(
        and(
          eq(globalAccompanimentModel.establishmentId, establishmentId),
          eq(globalAccompanimentModel.id, globalAccompanimentId),
        ),
      )
      .limit(1)
    return record ? DrizzleGlobalAccompanimentMapper.toDomain(record) : undefined
  }

  async findByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<GlobalAccompaniment | undefined> {
    const [record] = await this.database
      .select()
      .from(globalAccompanimentModel)
      .where(
        and(
          eq(globalAccompanimentModel.establishmentId, establishmentId),
          eq(globalAccompanimentModel.accompanimentProductId, accompanimentProductId),
        ),
      )
      .limit(1)
    return record ? DrizzleGlobalAccompanimentMapper.toDomain(record) : undefined
  }

  async findManyByEstablishmentId(
    establishmentId: string,
  ): Promise<readonly GlobalAccompaniment[]> {
    const records = await this.database
      .select()
      .from(globalAccompanimentModel)
      .where(eq(globalAccompanimentModel.establishmentId, establishmentId))
      .orderBy(asc(globalAccompanimentModel.id))
    return records.map(DrizzleGlobalAccompanimentMapper.toDomain)
  }

  async countByTypeId(establishmentId: string, typeId: string): Promise<number> {
    const [record] = await this.database
      .select({ count: count() })
      .from(globalAccompanimentModel)
      .where(
        and(
          eq(globalAccompanimentModel.establishmentId, establishmentId),
          eq(globalAccompanimentModel.accompanimentTypeId, typeId),
        ),
      )
    return Number(record?.count ?? 0)
  }

  async replace(
    establishmentId: string,
    globalAccompanimentId: string,
    changes: GlobalAccompanimentUpdate,
  ): Promise<GlobalAccompaniment> {
    try {
      const [record] = await this.database
        .update(globalAccompanimentModel)
        .set({
          accompanimentTypeId: changes.accompanimentTypeId,
          quantityPerPortion: String(changes.quantityPerPortion),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(globalAccompanimentModel.establishmentId, establishmentId),
            eq(globalAccompanimentModel.id, globalAccompanimentId),
          ),
        )
        .returning()
      if (!record)
        throw new ConflictError('A operação no banco de dados entrou em conflito.')
      return DrizzleGlobalAccompanimentMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(establishmentId: string, globalAccompanimentId: string): Promise<void> {
    try {
      const records = await this.database
        .delete(globalAccompanimentModel)
        .where(
          and(
            eq(globalAccompanimentModel.establishmentId, establishmentId),
            eq(globalAccompanimentModel.id, globalAccompanimentId),
          ),
        )
        .returning({ id: globalAccompanimentModel.id })
      if (!records.length)
        throw new ConflictError('A operação no banco de dados entrou em conflito.')
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(globalAccompanimentModel)
  }

  private toConflictError(error: unknown): unknown {
    if (this.isIntegrityConstraintError(error)) {
      return new ConflictError('A operação no banco de dados entrou em conflito.')
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
