import type { User, UserCreate, UserUpdate } from '@scoops/core/identity/domain/entities'
import type { UsersListParams } from '@scoops/core/identity/domain/structures'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleUserMapper } from '@/identity/database/drizzle/mappers/drizzle-user-mapper'
import { userModel } from '@/identity/database/drizzle/models/user-model'

@Injectable()
export class DrizzleUsersRepository extends DrizzleRepository implements UsersRepository {
  async add(input: UserCreate): Promise<User> {
    const [record] = await this.database.insert(userModel).values(input).returning()

    return DrizzleUserMapper.toDomain(record)
  }

  async addMany(inputs: UserCreate[]): Promise<User[]> {
    if (inputs.length === 0) return []

    const records = await this.database.insert(userModel).values(inputs).returning()

    return records.map(DrizzleUserMapper.toDomain)
  }

  async findById(userId: string): Promise<User | undefined> {
    const [record] = await this.database
      .select()
      .from(userModel)
      .where(eq(userModel.id, userId))
      .limit(1)

    return record ? DrizzleUserMapper.toDomain(record) : undefined
  }

  async findByIdInEstablishment(
    establishmentId: string,
    userId: string,
  ): Promise<User | undefined> {
    const [record] = await this.database
      .select()
      .from(userModel)
      .where(
        and(eq(userModel.establishmentId, establishmentId), eq(userModel.id, userId)),
      )
      .limit(1)

    return record ? DrizzleUserMapper.toDomain(record) : undefined
  }

  async findByProviderSubject(providerSubject: string): Promise<User | undefined> {
    const [record] = await this.database
      .select()
      .from(userModel)
      .where(eq(userModel.id, providerSubject))
      .limit(1)

    return record ? DrizzleUserMapper.toDomain(record) : undefined
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [record] = await this.database
      .select()
      .from(userModel)
      .where(sql`lower(${userModel.email}) = lower(${email})`)
      .limit(1)

    return record ? DrizzleUserMapper.toDomain(record) : undefined
  }

  async findMany(input: UsersListParams) {
    const filters = [eq(userModel.establishmentId, input.establishmentId)]

    if (input.excludeUserId) filters.push(ne(userModel.id, input.excludeUserId))

    if (input.search) {
      const searchFilter = or(
        ilike(userModel.name, `%${input.search}%`),
        ilike(userModel.email, `%${input.search}%`),
      )

      if (searchFilter) filters.push(searchFilter)
    }

    if (input.profile) filters.push(eq(userModel.profile, input.profile))
    if (input.status) filters.push(eq(userModel.status, input.status))

    const offset = Math.max(input.page - 1, 0) * input.pageSize
    const [records, totalRows] = await Promise.all([
      this.database
        .select()
        .from(userModel)
        .where(and(...filters))
        .orderBy(asc(userModel.name), asc(userModel.id))
        .limit(input.pageSize)
        .offset(offset),
      this.database
        .select({ count: count() })
        .from(userModel)
        .where(and(...filters)),
    ])
    const total = Number(totalRows[0]?.count ?? 0)

    return new PaginationResponse(
      records.map(DrizzleUserMapper.toDomain),
      input.page,
      input.pageSize,
      total,
      Math.ceil(total / input.pageSize),
    )
  }

  async countActiveManagers(establishmentId: string): Promise<number> {
    const [result] = await this.database
      .select({ count: count() })
      .from(userModel)
      .where(
        and(
          eq(userModel.establishmentId, establishmentId),
          eq(userModel.profile, UserProfile.Manager),
          eq(userModel.status, UserStatus.Active),
        ),
      )

    return Number(result?.count ?? 0)
  }

  async replace(
    establishmentId: string,
    userId: string,
    changes: UserUpdate,
  ): Promise<User> {
    const [record] = await this.database
      .update(userModel)
      .set(changes)
      .where(
        and(eq(userModel.establishmentId, establishmentId), eq(userModel.id, userId)),
      )
      .returning()

    return DrizzleUserMapper.toDomain(record)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userModel)
  }

  async remove(establishmentId: string, userId: string): Promise<void> {
    await this.database
      .delete(userModel)
      .where(
        and(eq(userModel.establishmentId, establishmentId), eq(userModel.id, userId)),
      )
  }
}
