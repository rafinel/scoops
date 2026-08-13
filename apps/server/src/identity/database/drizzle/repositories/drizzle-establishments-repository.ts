import type {
  Establishment,
  EstablishmentCreate,
  EstablishmentUpdate,
} from '@scoops/core/identity/domain/entities'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleEstablishmentMapper } from '@/identity/database/drizzle/mappers/drizzle-establishment-mapper'
import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'

@Injectable()
export class DrizzleEstablishmentsRepository
  extends DrizzleRepository
  implements EstablishmentsRepository
{
  async add(input: EstablishmentCreate): Promise<Establishment> {
    const [record] = await this.database
      .insert(establishmentModel)
      .values(input)
      .returning()

    return DrizzleEstablishmentMapper.toDomain(record)
  }

  async addMany(inputs: EstablishmentCreate[]): Promise<Establishment[]> {
    if (inputs.length === 0) return []

    const records = await this.database
      .insert(establishmentModel)
      .values(inputs)
      .returning()

    return records.map(DrizzleEstablishmentMapper.toDomain)
  }

  async findById(establishmentId: string): Promise<Establishment | undefined> {
    const [record] = await this.database
      .select()
      .from(establishmentModel)
      .where(eq(establishmentModel.id, establishmentId))
      .limit(1)

    return record ? DrizzleEstablishmentMapper.toDomain(record) : undefined
  }

  async removeAll(): Promise<void> {
    await this.database.delete(establishmentModel)
  }

  async replace(
    establishmentId: string,
    changes: EstablishmentUpdate,
  ): Promise<Establishment> {
    const [record] = await this.database
      .update(establishmentModel)
      .set(changes)
      .where(eq(establishmentModel.id, establishmentId))
      .returning()

    return DrizzleEstablishmentMapper.toDomain(record)
  }
}
