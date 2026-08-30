import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type { OrderCancellation } from '#pdv/domain/structures/order-cancellation.ts'
import type { StockRestorationTarget } from '#pdv/domain/structures/stock-restoration-target.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Actor = {
  readonly id: string
  readonly name: string
  readonly establishmentId: string
  readonly profile: UserProfile
}

export type CancelOrderRequest = {
  readonly actor: Actor
  readonly orderId: string
  readonly reason?: string
}

export class CancelOrderUseCase implements UseCase<CancelOrderRequest, Order> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: CancelOrderRequest): Promise<Order> {
    this.validateActor(request.actor)
    const reason = this.normalizeReason(request.reason)

    return this.database.run(async (scope) => {
      const order = await scope.ordersRepository.findByIdForUpdate(
        request.actor.establishmentId,
        request.orderId,
      )
      if (!order || order.establishmentId !== request.actor.establishmentId)
        throw new NotFoundError('Pedido não encontrado.')
      if (order.status !== OrderStatus.Registered)
        throw new ConflictError('O pedido já foi cancelado.')

      const occurredAt = this.datetimeProvider.now()
      const restorations = await scope.stockRestorer.restore({
        establishmentId: request.actor.establishmentId,
        orderId: order.id,
        performedBy: request.actor.id,
        performedByName: request.actor.name,
        occurredAt,
        targets: toRestorationTargets(order),
      })
      const cancellation: OrderCancellation = {
        canceledAt: occurredAt,
        canceledBy: request.actor.id,
        canceledByName: request.actor.name,
        ...(reason ? { reason } : {}),
        restorations,
      }

      return scope.ordersRepository.cancel(
        request.actor.establishmentId,
        order.id,
        cancellation,
      )
    })
  }

  private validateActor(actor: Actor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem cancelar pedidos.')
  }

  private normalizeReason(reason: string | undefined): string | undefined {
    const normalized = reason?.trim()
    if (normalized && normalized.length > 500)
      throw new BadRequestError(
        'O motivo do cancelamento deve ter no máximo 500 caracteres.',
      )
    return normalized || undefined
  }
}

function toRestorationTargets(order: Order): readonly StockRestorationTarget[] {
  const snapshots = new Map<string, { name: string; brands: Map<string, string> }>()
  const accompanimentNames = new Map<string, string>()

  for (const line of order.lines) {
    const current = snapshots.get(line.product.productId) ?? {
      name: line.product.name,
      brands: new Map<string, string>(),
    }
    if (line.brand) current.brands.set(line.brand.brandId, line.brand.name)
    snapshots.set(line.product.productId, current)
    for (const accompaniment of line.accompaniments)
      accompanimentNames.set(accompaniment.accompanimentId, accompaniment.name)
  }

  const targets = new Map<string, StockRestorationTarget & { readonly order: number }>()
  let position = 0
  for (const line of order.lines) {
    for (const consumption of line.consumptions) {
      const key = `${consumption.productId}:${consumption.brandId ?? ''}`
      const current = targets.get(key)
      if (current) {
        targets.set(key, {
          ...current,
          quantity: current.quantity + consumption.quantity,
        })
        continue
      }

      const snapshot = snapshots.get(consumption.productId)
      const brandName = consumption.brandId
        ? (consumption.brandName ??
          snapshot?.brands.get(consumption.brandId) ??
          'Marca removida')
        : undefined
      targets.set(key, {
        productId: consumption.productId,
        productName:
          consumption.productName ??
          snapshot?.name ??
          (consumption.accompanimentId
            ? accompanimentNames.get(consumption.accompanimentId)
            : undefined) ??
          'Produto removido',
        ...(consumption.brandId ? { brandId: consumption.brandId, brandName } : {}),
        quantity: consumption.quantity,
        order: position++,
      })
    }
  }

  return [...targets.values()]
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...target }) => target)
}
