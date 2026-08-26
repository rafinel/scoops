import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type {
  SalesChannelCreate,
  SalesChannelUpdate,
} from '@scoops/core/pdv/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { and, asc, eq, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleSalesChannelMapper } from '@/pdv/database/drizzle/mappers/drizzle-sales-channel-mapper'
import { salesChannelModel } from '@/pdv/database/drizzle/models/sales-channel-model'

type SalesChannelStatus = SalesChannel['status']
type SalesChannelReplace = SalesChannelUpdate | { status: SalesChannelStatus }

const ACTIVE_STATUS: SalesChannelStatus = 'active'

@Injectable()
export class DrizzleSalesChannelsRepository
  extends DrizzleRepository
  implements SalesChannelsRepository
{
  async add(input: SalesChannelCreate): Promise<SalesChannel> {
    try {
      const [record] = await this.database
        .insert(salesChannelModel)
        .values(this.toPersistence(input))
        .returning()

      return DrizzleSalesChannelMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async addMany(inputs: SalesChannelCreate[]): Promise<readonly SalesChannel[]> {
    if (inputs.length === 0) return []

    try {
      const records = await this.database
        .insert(salesChannelModel)
        .values(inputs.map((input) => this.toPersistence(input)))
        .returning()

      return records.map(DrizzleSalesChannelMapper.toDomain)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(
    establishmentId: string,
    channelId: string,
  ): Promise<SalesChannel | undefined> {
    const [record] = await this.database
      .select()
      .from(salesChannelModel)
      .where(
        and(
          eq(salesChannelModel.establishmentId, establishmentId),
          eq(salesChannelModel.id, channelId),
        ),
      )
      .limit(1)

    return record ? DrizzleSalesChannelMapper.toDomain(record) : undefined
  }

  async findByNormalizedName(
    establishmentId: string,
    normalizedName: string,
  ): Promise<SalesChannel | undefined> {
    const [record] = await this.database
      .select()
      .from(salesChannelModel)
      .where(
        and(
          eq(salesChannelModel.establishmentId, establishmentId),
          sql`lower(btrim(${salesChannelModel.name})) = ${normalizedName}`,
        ),
      )
      .limit(1)

    return record ? DrizzleSalesChannelMapper.toDomain(record) : undefined
  }

  async findMany(establishmentId: string): Promise<readonly SalesChannel[]> {
    const records = await this.database
      .select()
      .from(salesChannelModel)
      .where(eq(salesChannelModel.establishmentId, establishmentId))
      .orderBy(
        asc(sql`lower(btrim(${salesChannelModel.name}))`),
        asc(salesChannelModel.id),
      )

    return records.map(DrizzleSalesChannelMapper.toDomain)
  }

  async findActive(establishmentId: string): Promise<readonly SalesChannel[]> {
    const records = await this.database
      .select()
      .from(salesChannelModel)
      .where(
        and(
          eq(salesChannelModel.establishmentId, establishmentId),
          eq(salesChannelModel.status, ACTIVE_STATUS),
        ),
      )
      .orderBy(
        asc(sql`lower(btrim(${salesChannelModel.name}))`),
        asc(salesChannelModel.id),
      )

    return records.map(DrizzleSalesChannelMapper.toDomain)
  }

  async replace(
    establishmentId: string,
    channelId: string,
    changes: SalesChannelReplace,
  ): Promise<SalesChannel> {
    try {
      const update =
        'status' in changes
          ? { status: changes.status, updatedAt: new Date() }
          : {
              name: changes.name,
              percentage: String(changes.percentage),
              updatedAt: new Date(),
            }
      const [record] = await this.database
        .update(salesChannelModel)
        .set(update)
        .where(
          and(
            eq(salesChannelModel.establishmentId, establishmentId),
            eq(salesChannelModel.id, channelId),
          ),
        )
        .returning()

      if (!record) throw new ConflictError('Database operation conflicted')
      return DrizzleSalesChannelMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async remove(establishmentId: string, channelId: string): Promise<void> {
    try {
      await this.database
        .delete(salesChannelModel)
        .where(
          and(
            eq(salesChannelModel.establishmentId, establishmentId),
            eq(salesChannelModel.id, channelId),
          ),
        )
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(salesChannelModel)
  }

  private toPersistence(input: SalesChannelCreate) {
    const now = new Date()

    return {
      id: crypto.randomUUID(),
      establishmentId: input.establishmentId,
      name: input.name,
      percentage: String(input.percentage),
      status: input.status,
      createdAt: now,
      updatedAt: now,
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
