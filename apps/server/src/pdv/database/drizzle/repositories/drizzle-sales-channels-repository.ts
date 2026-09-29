import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type {
  SalesChannelCreate,
  SalesChannelUpdate,
} from '@scoops/core/pdv/domain/structures'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { and, asc, eq, ilike, sql, type SQL } from 'drizzle-orm'
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
    return withConflictConversion(
      () =>
        this.database
          .insert(salesChannelModel)
          .values(this.toPersistence(input))
          .returning()
          .then(([record]) => DrizzleSalesChannelMapper.toDomain(record)),
      (error) => this.toConflictError(error),
    )
  }

  async addMany(inputs: SalesChannelCreate[]): Promise<readonly SalesChannel[]> {
    if (inputs.length === 0) return []
    return withConflictConversion(
      () =>
        this.database
          .insert(salesChannelModel)
          .values(inputs.map((input) => this.toPersistence(input)))
          .returning()
          .then((records) => records.map(DrizzleSalesChannelMapper.toDomain)),
      (error) => this.toConflictError(error),
    )
  }

  findById(
    establishmentId: string,
    channelId: string,
  ): Promise<SalesChannel | undefined> {
    return this.findOne(salesChannelIdentityFilter(establishmentId, channelId))
  }

  findByNormalizedName(
    establishmentId: string,
    normalizedName: string,
  ): Promise<SalesChannel | undefined> {
    return this.findOne(salesChannelNormalizedNameFilter(establishmentId, normalizedName))
  }

  async findMany(establishmentId: string): Promise<readonly SalesChannel[]> {
    const records = await this.findChannels(
      eq(salesChannelModel.establishmentId, establishmentId),
    )
    return records.map(DrizzleSalesChannelMapper.toDomain)
  }

  async findActive(establishmentId: string): Promise<readonly SalesChannel[]> {
    const records = await this.findChannels(salesChannelActiveFilter(establishmentId))
    return records.map(DrizzleSalesChannelMapper.toDomain)
  }

  searchByName(
    establishmentId: string,
    query: string,
    limit: number,
  ): Promise<readonly SalesChannel[]> {
    return this.findChannels(salesChannelSearchFilter(establishmentId, query))
      .limit(Math.min(Math.max(limit, 0), 5))
      .then((records) => records.map(DrizzleSalesChannelMapper.toDomain))
  }

  async replace(
    establishmentId: string,
    channelId: string,
    changes: SalesChannelReplace,
  ): Promise<SalesChannel> {
    return withConflictConversion(
      () =>
        this.database
          .update(salesChannelModel)
          .set(toSalesChannelUpdate(changes))
          .where(salesChannelIdentityFilter(establishmentId, channelId))
          .returning()
          .then(([record]) => {
            if (!record)
              throw new ConflictError('A operação no banco de dados entrou em conflito.')
            return DrizzleSalesChannelMapper.toDomain(record)
          }),
      (error) => this.toConflictError(error),
    )
  }

  async remove(establishmentId: string, channelId: string): Promise<void> {
    return withConflictConversion(
      () =>
        this.database
          .delete(salesChannelModel)
          .where(salesChannelIdentityFilter(establishmentId, channelId))
          .then(() => undefined),
      (error) => this.toConflictError(error),
    )
  }

  async removeAll(): Promise<void> {
    await this.database.delete(salesChannelModel)
  }

  private toPersistence(input: SalesChannelCreate) {
    const createdAt = new Date()
    return Object.assign(
      { id: crypto.randomUUID(), createdAt, updatedAt: createdAt },
      toSalesChannelPersistenceFields(input),
    )
  }

  private toConflictError(error: unknown): unknown {
    return this.isIntegrityConstraintError(error)
      ? new ConflictError('A operação no banco de dados entrou em conflito.')
      : error
  }

  private isIntegrityConstraintError(error: unknown): boolean {
    return isIntegrityConstraintError(error)
  }

  private async findOne(filter: SQL | undefined): Promise<SalesChannel | undefined> {
    const [record] = await this.database
      .select()
      .from(salesChannelModel)
      .where(filter)
      .limit(1)
    return record ? DrizzleSalesChannelMapper.toDomain(record) : undefined
  }

  private findChannels(filter: SQL | undefined) {
    return this.database
      .select()
      .from(salesChannelModel)
      .where(filter)
      .orderBy(...salesChannelNameOrder())
  }
}

function withConflictConversion<Result>(
  operation: () => Promise<Result>,
  convert: (error: unknown) => unknown,
): Promise<Result> {
  return operation().catch((error: unknown) => {
    throw convert(error)
  })
}

function salesChannelIdentityFilter(establishmentId: string, channelId: string) {
  return and(
    eq(salesChannelModel.establishmentId, establishmentId),
    eq(salesChannelModel.id, channelId),
  )
}

function salesChannelSearchFilter(establishmentId: string, query: string) {
  return and(
    eq(salesChannelModel.establishmentId, establishmentId),
    ilike(salesChannelModel.name, `%${escapeLikePattern(query)}%`),
  )
}

function salesChannelNormalizedNameFilter(
  establishmentId: string,
  normalizedName: string,
) {
  return and(
    eq(salesChannelModel.establishmentId, establishmentId),
    sql`lower(btrim(${salesChannelModel.name})) = ${normalizedName}`,
  )
}

function salesChannelActiveFilter(establishmentId: string) {
  return and(
    eq(salesChannelModel.establishmentId, establishmentId),
    eq(salesChannelModel.status, ACTIVE_STATUS),
  )
}

function salesChannelNameOrder() {
  return [
    asc(sql`lower(btrim(${salesChannelModel.name}))`),
    asc(salesChannelModel.id),
  ] as const
}

function toSalesChannelUpdate(changes: SalesChannelReplace) {
  const updatedAt = new Date()
  return 'status' in changes
    ? { status: changes.status, updatedAt }
    : { name: changes.name, percentage: String(changes.percentage), updatedAt }
}

function toSalesChannelPersistenceFields(input: SalesChannelCreate) {
  return {
    establishmentId: input.establishmentId,
    name: input.name,
    percentage: String(input.percentage),
    status: input.status,
  }
}

function isIntegrityConstraintError(error: unknown): boolean {
  let currentError = error
  while (isObject(currentError)) {
    if (hasConstraintCode(currentError)) return true
    currentError = getErrorCause(currentError)
  }
  return false
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasConstraintCode(error: Record<string, unknown>): boolean {
  return (
    'code' in error &&
    (error.code === '23505' || error.code === '23503' || error.code === '23514')
  )
}

function getErrorCause(error: Record<string, unknown>): unknown {
  return error.cause
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}
