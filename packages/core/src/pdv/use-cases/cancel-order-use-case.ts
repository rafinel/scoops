import type { PdvDatabaseRepositories } from '#pdv/interfaces/pdv-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type { OrderCancellation } from '#pdv/domain/structures/order-cancellation.ts'
import type { OrderLineDisposition } from '#pdv/domain/structures/order-line-disposition.ts'
import type { OrderStockRestoration } from '#pdv/domain/structures/order-stock-restoration.ts'
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
  readonly lineDispositions: readonly OrderLineDisposition[]
}

export class CancelOrderUseCase implements UseCase<CancelOrderRequest, Order> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly stockProvider?: import('#pdv/interfaces/stock-provider.ts').StockProvider,
  ) {}

  async execute(request: CancelOrderRequest): Promise<Order> {
    this.validateActor(request.actor)
    const reason = this.normalizeReason(request.reason)

    return this.database.run(
      async ({
        ordersRepository,
        stockProvider: scopedStockProvider,
      }: PdvDatabaseRepositories) => {
        const order = await ordersRepository.findByIdForUpdate(
          request.actor.establishmentId,
          request.orderId,
        )
        if (!order || order.establishmentId !== request.actor.establishmentId)
          throw new NotFoundError('Pedido não encontrado.')
        if (order.status !== OrderStatus.Registered)
          throw new ConflictError('O pedido já foi cancelado.')

        const dispositions = validateLineDispositions(
          request.lineDispositions,
          order.lines.length,
        )
        const entries = toDispositionTargets(order, dispositions)
        const returnTargets = entries.flatMap((entry) =>
          entry.disposition === 'return' ? [entry.target] : [],
        )

        const occurredAt = this.datetimeProvider.now()
        let restorations: readonly OrderStockRestoration[] = []
        if (returnTargets.length > 0) {
          const stockProvider = this.stockProvider ?? scopedStockProvider
          if (!stockProvider)
            throw new ConflictError('O restaurador de estoque não está disponível.')
          restorations = await stockProvider.restore({
            establishmentId: request.actor.establishmentId,
            orderId: order.id,
            performedBy: request.actor.id,
            performedByName: request.actor.name,
            occurredAt,
            targets: returnTargets,
          })
          if (restorations.length !== returnTargets.length)
            throw new ConflictError(
              'O resultado da devolução de estoque está incompleto.',
            )
          for (const [index, target] of returnTargets.entries()) {
            const restoration = restorations[index]
            if (!restoration || !matchesTarget(restoration, target))
              throw new ConflictError(
                'O resultado da devolução não corresponde ao consumo do pedido.',
              )
          }
        }

        let restorationIndex = 0
        const outcomes = entries.map(({ disposition, target }) => {
          if (disposition === 'loss') return { ...target, outcome: 'lost' as const }
          const restoration = restorations[restorationIndex++]
          if (!restoration)
            throw new ConflictError(
              'O resultado da devolução de estoque está incompleto.',
            )
          return restoration
        })
        const cancellation: OrderCancellation = {
          canceledAt: occurredAt,
          canceledBy: request.actor.id,
          canceledByName: request.actor.name,
          ...(reason ? { reason } : {}),
          outcomes,
        }

        return ordersRepository.cancel(
          request.actor.establishmentId,
          order.id,
          cancellation,
        )
      },
    )
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

function validateLineDispositions(
  lineDispositions: readonly OrderLineDisposition[],
  lineCount: number,
): ReadonlyMap<number, OrderLineDisposition['disposition']> {
  if (!Array.isArray(lineDispositions) || lineDispositions.length !== lineCount)
    throw new BadRequestError('Informe um destino para cada linha do pedido.')

  const dispositions = new Map<number, OrderLineDisposition['disposition']>()
  for (const choice of lineDispositions) {
    if (
      !choice ||
      !Number.isInteger(choice.linePosition) ||
      choice.linePosition < 0 ||
      choice.linePosition >= lineCount ||
      (choice.disposition !== 'return' && choice.disposition !== 'loss') ||
      dispositions.has(choice.linePosition)
    ) {
      throw new BadRequestError(
        'O destino informado para as linhas do pedido é inválido.',
      )
    }
    dispositions.set(choice.linePosition, choice.disposition)
  }
  if (dispositions.size !== lineCount)
    throw new BadRequestError('Informe um destino para cada linha do pedido.')
  return dispositions
}

function matchesTarget(
  restoration: OrderStockRestoration,
  target: StockRestorationTarget,
): boolean {
  return (
    restoration.linePosition === target.linePosition &&
    restoration.productId === target.productId &&
    restoration.productName === target.productName &&
    restoration.brandId === target.brandId &&
    restoration.brandName === target.brandName &&
    restoration.quantity === target.quantity &&
    (restoration.outcome === 'restored' || restoration.outcome === 'skipped')
  )
}

function toDispositionTargets(
  order: Order,
  dispositions: ReadonlyMap<number, OrderLineDisposition['disposition']>,
): readonly {
  disposition: OrderLineDisposition['disposition']
  target: StockRestorationTarget
}[] {
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

  const entries: {
    disposition: OrderLineDisposition['disposition']
    target: StockRestorationTarget
  }[] = []
  for (const [linePosition, line] of order.lines.entries()) {
    for (const consumption of line.consumptions) {
      const snapshot = snapshots.get(consumption.productId)
      const brandName = consumption.brandId
        ? (consumption.brandName ??
          snapshot?.brands.get(consumption.brandId) ??
          'Marca removida')
        : undefined
      entries.push({
        disposition: dispositions.get(
          linePosition,
        ) as OrderLineDisposition['disposition'],
        target: {
          linePosition,
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
        },
      })
    }
  }
  return entries
}
