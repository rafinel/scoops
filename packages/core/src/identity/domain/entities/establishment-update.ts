import type { Establishment } from '#identity/domain/entities/establishment.ts'

export type EstablishmentUpdate = Partial<
  Pick<Establishment, 'name' | 'status' | 'timeZone' | 'updatedAt' | 'activatedAt'>
>
