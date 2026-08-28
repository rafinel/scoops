import type { OrderSequencesRepository } from '@scoops/core/pdv/interfaces'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import { sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { orderSequenceModel } from '@/pdv/database/drizzle/models/order-sequence-model'

@Injectable()
export class DrizzleOrderSequencesRepository
  extends DrizzleRepository
  implements OrderSequencesRepository
{
  async next(establishmentId: string): Promise<number> {
    const [record] = await this.database
      .insert(orderSequenceModel)
      .values({ establishmentId, lastSequenceNumber: 1 })
      .onConflictDoUpdate({
        target: orderSequenceModel.establishmentId,
        set: {
          lastSequenceNumber: sql`${orderSequenceModel.lastSequenceNumber} + 1`,
        },
      })
      .returning({ sequenceNumber: orderSequenceModel.lastSequenceNumber })

    if (!record) throw new ConflictError('Database operation conflicted')
    return record.sequenceNumber
  }

  async removeAll(): Promise<void> {
    await this.database.delete(orderSequenceModel)
  }
}
