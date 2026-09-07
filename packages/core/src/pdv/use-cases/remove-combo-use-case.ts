import type { PdvDatabaseRepositories } from '#pdv/interfaces/pdv-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import { DiscountDeletedEvent } from '#pdv/domain/events/discount-deleted-event.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
type Request = {
  readonly actor: ComboActor
  readonly comboId: string
  readonly expectedUpdatedAt: Date
}
export class RemoveComboUseCase implements UseCase<Request> {
  constructor(private readonly database: PdvDatabase) {}
  async execute(request: Request): Promise<void> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    await this.database.run(
      async ({ discountsRepository, eventsRepository }: PdvDatabaseRepositories) => {
        const current = await discountsRepository.findById(
          request.actor.establishmentId,
          request.comboId,
        )
        if (!current || current.establishmentId !== request.actor.establishmentId)
          throw new NotFoundError('Combo não encontrado.')
        if (current.updatedAt.getTime() !== request.expectedUpdatedAt.getTime())
          throw new ConflictError('O combo foi alterado por outra operação.')
        await discountsRepository.remove(
          request.actor.establishmentId,
          current.id,
          request.expectedUpdatedAt,
        )
        const event = new DiscountDeletedEvent({
          discountId: current.id,
          establishmentId: current.establishmentId,
          type: current.type,
        })
        await eventsRepository.add(event)
        return current
      },
    )
  }
}
