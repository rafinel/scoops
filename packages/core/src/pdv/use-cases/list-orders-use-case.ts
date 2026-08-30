import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import type { OrderListParams } from '#pdv/domain/structures/order-list-params.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Actor = {
  readonly id: string
  readonly name: string
  readonly establishmentId: string
  readonly profile: UserProfile
}

export type ListOrdersRequest = Omit<
  OrderListParams,
  'establishmentId' | 'page' | 'pageSize'
> & {
  readonly actor: Actor
  readonly page: number
  readonly pageSize: number
}

export class ListOrdersUseCase
  implements UseCase<ListOrdersRequest, PaginationResponse<Order>>
{
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async execute(request: ListOrdersRequest): Promise<PaginationResponse<Order>> {
    this.validateActor(request.actor)
    const page = this.normalizePage(request.page)
    const pageSize = this.normalizePageSize(request.pageSize)

    return this.ordersRepository.findMany({
      establishmentId: request.actor.establishmentId,
      search: request.search?.trim() || undefined,
      createdFrom: request.createdFrom,
      createdTo: request.createdTo,
      channelId: request.channelId,
      status: request.status,
      page,
      pageSize,
    })
  }

  private validateActor(actor: Actor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar pedidos.',
      )
  }

  private normalizePage(page: number): number {
    if (!Number.isInteger(page) || page < 1)
      throw new BadRequestError('A página deve ser um número inteiro positivo.')
    return page
  }

  private normalizePageSize(pageSize: number): number {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
      throw new BadRequestError('O tamanho da página deve estar entre 1 e 100.')
    return pageSize
  }
}
