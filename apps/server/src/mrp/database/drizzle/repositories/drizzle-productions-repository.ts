import type { Production } from '@scoops/core/mrp/domain/entities'
import type { ProductionsRepository } from '@scoops/core/mrp/interfaces'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleProductionMapper } from '../mappers/drizzle-production-mapper'
import { productionModel } from '../models/production-model'

@Injectable()
export class DrizzleProductionsRepository
  extends DrizzleRepository
  implements ProductionsRepository
{
  async add(input: Omit<Production, 'id'>): Promise<Production> {
    const [record] = await this.database
      .insert(productionModel)
      .values({
        id: crypto.randomUUID(),
        establishmentId: input.establishmentId,
        productId: input.productId,
        recipeId: input.recipeId,
        productName: input.productName,
        unit: input.unit,
        recipeYield: String(input.recipeYield),
        quantity: String(input.quantity),
        totalCost: String(input.totalCost),
        performedBy: input.performedBy,
        performedByName: input.performedByName,
        occurredAt: input.occurredAt,
      })
      .returning()
    return DrizzleProductionMapper.toDomain(record)
  }
}
