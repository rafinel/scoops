import type { Product } from '@scoops/core/mrp/domain/entities'

import type { DrizzleProduct } from '../types'

export class DrizzleProductMapper {
  static toDomain(record: DrizzleProduct): Product {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      name: record.name,
      unit: record.unit,
      categories: record.categories,
      stockControl: record.stockControl,
      status: record.status,
      allowNegativeStock: record.allowNegativeStock,
      idealStock: record.idealStock === null ? undefined : Number(record.idealStock),
      currentUnitCost:
        record.currentUnitCost === null ? undefined : Number(record.currentUnitCost),
      internalNotes: record.internalNotes ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
