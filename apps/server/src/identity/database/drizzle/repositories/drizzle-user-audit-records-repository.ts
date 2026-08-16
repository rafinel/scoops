import type {
  UserAuditRecord,
  UserAuditRecordCreate,
} from '@scoops/core/identity/domain/entities'
import type { UserAuditRecordsRepository } from '@scoops/core/identity/interfaces'
import { and, desc, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { DrizzleUserAuditRecordMapper } from '@/identity/database/drizzle/mappers/drizzle-user-audit-record-mapper'
import { userAuditRecordModel } from '@/identity/database/drizzle/models/user-audit-record-model'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleUserAuditRecordsRepository
  extends DrizzleRepository
  implements UserAuditRecordsRepository
{
  async add(input: UserAuditRecordCreate): Promise<UserAuditRecord> {
    const [record] = await this.database
      .insert(userAuditRecordModel)
      .values(this.toPersistenceInput(input))
      .returning()

    return DrizzleUserAuditRecordMapper.toDomain(record)
  }

  async addMany(inputs: UserAuditRecordCreate[]): Promise<UserAuditRecord[]> {
    if (inputs.length === 0) return []

    const records = await this.database
      .insert(userAuditRecordModel)
      .values(inputs.map((record) => this.toPersistenceInput(record)))
      .returning()

    return records.map(DrizzleUserAuditRecordMapper.toDomain)
  }

  async findManyByUser(input: {
    establishmentId: string
    affectedUserId: string
  }): Promise<UserAuditRecord[]> {
    const records = await this.database
      .select()
      .from(userAuditRecordModel)
      .where(
        and(
          eq(userAuditRecordModel.establishmentId, input.establishmentId),
          eq(userAuditRecordModel.affectedUserId, input.affectedUserId),
        ),
      )
      .orderBy(desc(userAuditRecordModel.occurredAt), desc(userAuditRecordModel.id))

    return records.map(DrizzleUserAuditRecordMapper.toDomain)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userAuditRecordModel)
  }

  private toPersistenceInput(input: UserAuditRecordCreate) {
    return {
      ...input,
      id: this.isUuid(input.id) ? input.id : randomUUID(),
      actorUserId: input.actorUserId ?? null,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
    }
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  }
}
