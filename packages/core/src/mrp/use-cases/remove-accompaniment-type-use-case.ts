import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly typeId: string
}

export class RemoveAccompanimentTypeUseCase implements UseCase<Request, void> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)
    await this.database.run(async (scope) => {
      const type = await scope.accompanimentTypesRepository.findById(
        request.actor.establishmentId,
        request.typeId,
      )
      if (!type || type.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('Tipo de acompanhamento não encontrado.')
      }
      const usageCount = await scope.productAccompanimentsRepository.countByTypeId(
        request.actor.establishmentId,
        type.id,
      )
      if (usageCount > 0) {
        throw new ConflictError('O tipo de acompanhamento está em uso.')
      }
      await scope.accompanimentTypesRepository.remove(
        request.actor.establishmentId,
        type.id,
      )
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError(
        'Somente gestores podem remover tipos de acompanhamento.',
      )
    }
  }
}
