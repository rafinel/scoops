import {
  EstablishmentStatus,
  type EstablishmentStatus as EstablishmentStatusValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const establishmentStatusModel = pgEnum(
  'establishment_status',
  Object.values(EstablishmentStatus) as [
    EstablishmentStatusValue,
    ...EstablishmentStatusValue[],
  ],
)
