import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Actor = {
  readonly id: string
  readonly name: string
  readonly establishmentId: string
  readonly profile: UserProfile
}

export type GetOrderRequest = {
  readonly actor: Actor
  readonly orderId: string
}

export class GetOrderUseCase implements UseCase<GetOrderRequest, Order> {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async execute(request: GetOrderRequest): Promise<Order> {
    this.validateActor(request.actor)
    const order = await this.ordersRepository.findById(
      request.actor.establishmentId,
      request.orderId,
    )
    if (!order || order.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Pedido não encontrado.')
    return order
  }

  private validateActor(actor: Actor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar pedidos.',
      )
  }
}
