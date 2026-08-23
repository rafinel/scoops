import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { AccompanimentType } from '#mrp/domain/entities/accompaniment-type.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { normalizeName } from '#mrp/use-cases/create-accompaniment-type-use-case.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly typeId: string
  readonly name: string
}

export class RenameAccompanimentTypeUseCase
  implements UseCase<Request, AccompanimentType>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<AccompanimentType> {
    this.validateActor(request.actor)
    const name = normalizeName(request.name)
    return this.database.run(async (scope) => {
      const type = await scope.accompanimentTypesRepository.findById(
        request.actor.establishmentId,
        request.typeId,
      )
      if (!type || type.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('Tipo de acompanhamento não encontrado.')
      }
      if (normalizeName(type.name).toLocaleLowerCase() === name.toLocaleLowerCase()) {
        return type
      }
      const existing = await scope.accompanimentTypesRepository.findByName(
        request.actor.establishmentId,
        name,
      )
      if (existing && existing.id !== type.id) {
        throw new ConflictError('Já existe um tipo com esse nome neste estabelecimento.')
      }
      return scope.accompanimentTypesRepository.replace(
        request.actor.establishmentId,
        type.id,
        { name },
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem renomear tipos de acompanhamento.',
      )
    }
  }
}
