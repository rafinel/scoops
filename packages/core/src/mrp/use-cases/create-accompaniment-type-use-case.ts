import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly name: string
}

export class CreateAccompanimentTypeUseCase
  implements UseCase<Request, AccompanimentType>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<AccompanimentType> {
    this.validateActor(request.actor)
    const name = normalizeName(request.name)
    return this.database.run(async (scope) => {
      const existing = await scope.accompanimentTypesRepository.findByName(
        request.actor.establishmentId,
        name,
      )
      if (existing)
        throw new ConflictError('Já existe um tipo com esse nome neste estabelecimento.')
      return scope.accompanimentTypesRepository.add({
        establishmentId: request.actor.establishmentId,
        name,
      })
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem criar tipos de acompanhamento.',
      )
    }
  }
}

export function normalizeName(name: string): string {
  const normalized = name.trim()
  if (normalized.length < 1 || normalized.length > 120) {
    throw new BadRequestError('O nome deve ter entre 1 e 120 caracteres.')
  }
  return normalized
}
