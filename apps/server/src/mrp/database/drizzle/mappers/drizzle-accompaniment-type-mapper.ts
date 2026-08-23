import type { AccompanimentType } from '@scoops/core/mrp/domain/entities'

import type { DrizzleAccompanimentType } from '../types'

export class DrizzleAccompanimentTypeMapper {
  static toDomain(record: DrizzleAccompanimentType): AccompanimentType {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
