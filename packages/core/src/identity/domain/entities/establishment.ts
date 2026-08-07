import type { Entity } from '#shared/domain/entities/entity.ts'
import type { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'

export type Establishment = Entity & {
  name: string
  status: EstablishmentStatus
  createdAt: Date
  updatedAt: Date
  activatedAt?: Date
}

export type EstablishmentCreate = Pick<
  Establishment,
  'id' | 'name' | 'status' | 'createdAt' | 'updatedAt'
>

export type EstablishmentUpdate = Partial<
  Pick<Establishment, 'name' | 'status' | 'updatedAt' | 'activatedAt'>
>
