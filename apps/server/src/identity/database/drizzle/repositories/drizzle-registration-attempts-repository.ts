import type {
  UserRegistrationAttempt,
  UserRegistrationAttemptCreate,
  UserRegistrationAttemptUpdate,
} from '@scoops/core/identity/domain/entities'
import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
import { RegistrationAttemptStatus } from '@scoops/core/identity/domain/structures'
import { and, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleUserRegistrationAttemptMapper } from '@/identity/database/drizzle/mappers/drizzle-user-registration-attempt-mapper'
import { userRegistrationAttemptModel } from '@/identity/database/drizzle/models/user-registration-attempt-model'

@Injectable()
export class DrizzleRegistrationAttemptsRepository
  extends DrizzleRepository
  implements RegistrationAttemptsRepository
{
  async add(input: UserRegistrationAttemptCreate): Promise<UserRegistrationAttempt> {
    const [record] = await this.database
      .insert(userRegistrationAttemptModel)
      .values(input)
      .returning()

    return DrizzleUserRegistrationAttemptMapper.toDomain(record)
  }

  async addMany(
    inputs: UserRegistrationAttemptCreate[],
  ): Promise<UserRegistrationAttempt[]> {
    if (inputs.length === 0) return []

    const records = await this.database
      .insert(userRegistrationAttemptModel)
      .values(inputs)
      .returning()

    return records.map(DrizzleUserRegistrationAttemptMapper.toDomain)
  }

  async findById(attemptId: string): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async findActiveByEmail(email: string): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(
        and(
          eq(userRegistrationAttemptModel.email, email),
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
        ),
      )
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async replace(
    attemptId: string,
    changes: UserRegistrationAttemptUpdate,
  ): Promise<UserRegistrationAttempt> {
    const [record] = await this.database
      .update(userRegistrationAttemptModel)
      .set(changes)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
      .returning()

    return DrizzleUserRegistrationAttemptMapper.toDomain(record)
  }

  async remove(attemptId: string): Promise<void> {
    await this.database
      .delete(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userRegistrationAttemptModel)
  }
}
