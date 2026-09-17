import type { Establishment } from '#identity/domain/entities/establishment.ts'
import type { EstablishmentCreate } from '#identity/domain/entities/establishment-create.ts'
import type { EstablishmentUpdate } from '#identity/domain/entities/establishment-update.ts'

export interface EstablishmentsRepository {
  add(input: EstablishmentCreate): Promise<Establishment>
  addMany(inputs: EstablishmentCreate[]): Promise<Establishment[]>
  findById(establishmentId: string): Promise<Establishment | undefined>
  removeAll(): Promise<void>
  remove(establishmentId: string): Promise<void>
  replace(establishmentId: string, changes: EstablishmentUpdate): Promise<Establishment>
}
