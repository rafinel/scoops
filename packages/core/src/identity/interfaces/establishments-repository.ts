import type { Establishment } from '#identity/domain/entities/establishment.ts'
import type {
  EstablishmentCreate,
  EstablishmentUpdate,
} from '#identity/domain/entities/establishment.ts'

export interface EstablishmentsRepository {
  add(input: EstablishmentCreate): Promise<Establishment>
  findById(establishmentId: string): Promise<Establishment | undefined>
  replace(establishmentId: string, changes: EstablishmentUpdate): Promise<Establishment>
}
