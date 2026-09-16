import type { Entity } from '#shared/domain/entities/entity.ts'
import type { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import type { EstablishmentTimezone } from '#identity/domain/structures/establishment-timezone.ts'

export type Establishment = Entity & {
  name: string
  status: EstablishmentStatus
  timeZone: EstablishmentTimezone
  createdAt: Date
  updatedAt: Date
  activatedAt?: Date
}
