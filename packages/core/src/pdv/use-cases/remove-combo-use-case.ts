import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ComboActor } from '#pdv/domain/structures/combo-actor.ts'
import { DiscountDeletedEvent } from '#pdv/domain/events/discount-deleted-event.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
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
  constructor(
    private readonly database: PdvDatabase,
    private readonly broker: Broker,
  ) {}
  async execute(request: Request): Promise<void> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem gerenciar combos.')
    const combo = await this.database.run(async (scope) => {
      const current = await scope.discountsRepository.findById(
        request.actor.establishmentId,
        request.comboId,
      )
      if (!current || current.establishmentId !== request.actor.establishmentId)
        throw new NotFoundError('Combo não encontrado.')
      if (current.updatedAt.getTime() !== request.expectedUpdatedAt.getTime())
        throw new ConflictError('O combo foi alterado por outra operação.')
      await scope.discountsRepository.remove(
        request.actor.establishmentId,
        current.id,
        request.expectedUpdatedAt,
      )
      return current
    })
    await this.broker.publish(
      new DiscountDeletedEvent({
        discountId: combo.id,
        establishmentId: combo.establishmentId,
        type: combo.type,
      }),
    )
  }
}
