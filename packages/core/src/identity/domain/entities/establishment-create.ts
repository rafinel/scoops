import type { Establishment } from '#identity/domain/entities/establishment.ts'

export type EstablishmentCreate = Pick<
  Establishment,
  'id' | 'name' | 'status' | 'timeZone' | 'createdAt' | 'updatedAt'
>
