import type { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import type { EstablishmentTimezone } from '#identity/domain/structures/establishment-timezone.ts'

export type EstablishmentSettings = {
  establishment: {
    id: string
    name: string
    status: EstablishmentStatus
    timeZone: EstablishmentTimezone
    createdAt: Date
    updatedAt: Date
  }
  responsibleManager: {
    id: string
    name: string
  }
}
