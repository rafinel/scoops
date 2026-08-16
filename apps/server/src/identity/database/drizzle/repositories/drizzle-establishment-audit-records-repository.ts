import type {
  EstablishmentAuditRecord,
  EstablishmentAuditRecordCreate,
} from '@scoops/core/identity/domain/entities'
import type { EstablishmentAuditRecordsRepository } from '@scoops/core/identity/interfaces'
import { desc, eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { DrizzleEstablishmentAuditRecordMapper } from '@/identity/database/drizzle/mappers/drizzle-establishment-audit-record-mapper'
import { establishmentAuditRecordModel } from '@/identity/database/drizzle/models/establishment-audit-record-model'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleEstablishmentAuditRecordsRepository
  extends DrizzleRepository
  implements EstablishmentAuditRecordsRepository
{
  async add(input: EstablishmentAuditRecordCreate): Promise<EstablishmentAuditRecord> {
    const [record] = await this.database
      .insert(establishmentAuditRecordModel)
      .values(this.toPersistenceInput(input))
      .returning()

    return DrizzleEstablishmentAuditRecordMapper.toDomain(record)
  }

  async addMany(
    inputs: EstablishmentAuditRecordCreate[],
  ): Promise<EstablishmentAuditRecord[]> {
    if (inputs.length === 0) return []

    const records = await this.database
      .insert(establishmentAuditRecordModel)
      .values(inputs.map((record) => this.toPersistenceInput(record)))
      .returning()

    return records.map(DrizzleEstablishmentAuditRecordMapper.toDomain)
  }

  async findManyByEstablishment(
    establishmentId: string,
  ): Promise<EstablishmentAuditRecord[]> {
    const records = await this.database
      .select()
      .from(establishmentAuditRecordModel)
      .where(eq(establishmentAuditRecordModel.establishmentId, establishmentId))
      .orderBy(
        desc(establishmentAuditRecordModel.occurredAt),
        desc(establishmentAuditRecordModel.id),
      )

    return records.map(DrizzleEstablishmentAuditRecordMapper.toDomain)
  }

  async removeAll(): Promise<void> {
    await this.database.delete(establishmentAuditRecordModel)
  }

  private toPersistenceInput(input: EstablishmentAuditRecordCreate) {
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
