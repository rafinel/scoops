import type { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'

export type EstablishmentSettings = {
  establishment: {
    id: string
    name: string
    status: EstablishmentStatus
    createdAt: Date
    updatedAt: Date
  }
  responsibleManager: {
    id: string
    name: string
  }
}
