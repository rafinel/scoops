import type { PdvDatabaseRepositories } from '#pdv/interfaces/pdv-database.ts'
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
  readonly lineDispositions: readonly import('#pdv/domain/structures/order-line-disposition.ts').OrderLineDisposition[]
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

        const lineDispositions = request.lineDispositions
        const { entries, returnTargets } = toRestorationTargets(order, lineDispositions)
        const occurredAt = this.datetimeProvider.now()

        const stockProvider = this.stockProvider ?? scopedStockProvider
        const restorations = await restoreTargets(stockProvider, {
          establishmentId: request.actor.establishmentId,
          orderId: order.id,
          performedBy: request.actor.id,
          performedByName: request.actor.name,
          occurredAt,
          targets: returnTargets,
        })
        const cancellation: OrderCancellation = {
          canceledAt: occurredAt,
          canceledBy: request.actor.id,
          canceledByName: request.actor.name,
          ...(reason ? { reason } : {}),
          outcomes: toOutcomes(entries, restorations),
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

function toRestorationTargets(
  order: Order,
  lineDispositions: CancelOrderRequest['lineDispositions'],
): {
  entries: readonly {
    disposition: 'return' | 'loss'
    target: StockRestorationTarget
  }[]
  returnTargets: readonly StockRestorationTarget[]
} {
  if (!Array.isArray(lineDispositions) || lineDispositions.length !== order.lines.length)
    throw new BadRequestError('Informe um destino para cada linha do pedido.')
  const dispositions = new Map<number, 'return' | 'loss'>()
  for (const choice of lineDispositions) {
    if (
      !choice ||
      !Number.isInteger(choice.linePosition) ||
      choice.linePosition < 0 ||
      choice.linePosition >= order.lines.length ||
      (choice.disposition !== 'return' && choice.disposition !== 'loss') ||
      dispositions.has(choice.linePosition)
    )
      throw new BadRequestError(
        'O destino informado para as linhas do pedido é inválido.',
      )
    dispositions.set(choice.linePosition, choice.disposition)
  }

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

  const entries: { disposition: 'return' | 'loss'; target: StockRestorationTarget }[] = []
  const returnTargets: StockRestorationTarget[] = []
  for (const [linePosition, line] of order.lines.entries()) {
    for (const consumption of line.consumptions) {
      const snapshot = snapshots.get(consumption.productId)
      const brandName = consumption.brandId
        ? (consumption.brandName ??
          snapshot?.brands.get(consumption.brandId) ??
          'Marca removida')
        : undefined
      const target: StockRestorationTarget = {
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
      }
      const disposition = dispositions.get(linePosition) as 'return' | 'loss'
      entries.push({ disposition, target })
      if (disposition === 'return') returnTargets.push(target)
    }
  }
  return { entries, returnTargets }
}

async function restoreTargets(
  stockProvider: import('#pdv/interfaces/stock-provider.ts').StockProvider | undefined,
  request: import('#pdv/domain/structures/stock-restoration-request.ts').StockRestorationRequest,
): Promise<
  readonly import('#pdv/domain/structures/order-stock-restoration.ts').OrderStockRestoration[]
> {
  if (request.targets.length === 0) return []
  if (!stockProvider)
    throw new ConflictError('O restaurador de estoque não está disponível.')
  const restorations = await stockProvider.restore(request)
  validateRestorations(restorations, request.targets)
  return restorations
}

function validateRestorations(
  restorations: readonly import('#pdv/domain/structures/order-stock-restoration.ts').OrderStockRestoration[],
  targets: readonly StockRestorationTarget[],
): void {
  if (restorations.length !== targets.length)
    throw new ConflictError('O resultado da devolução de estoque está incompleto.')
  if (targets.some((target, index) => !matchesTarget(restorations[index], target)))
    throw new ConflictError(
      'O resultado da devolução não corresponde ao consumo do pedido.',
    )
}

function matchesTarget(
  restoration:
    | import('#pdv/domain/structures/order-stock-restoration.ts').OrderStockRestoration
    | undefined,
  target: StockRestorationTarget,
): boolean {
  return (
    (restoration?.outcome === 'restored' || restoration?.outcome === 'skipped') &&
    targetKey(restoration) === targetKey(target)
  )
}

const targetKey = (
  target: Omit<StockRestorationTarget, 'linePosition'> & {
    readonly linePosition?: number
  },
) =>
  JSON.stringify([
    target.linePosition,
    target.productId,
    target.productName,
    target.brandId,
    target.brandName,
    target.quantity,
  ])

type DispositionEntry = {
  disposition: 'return' | 'loss'
  target: StockRestorationTarget
}

function toOutcomes(
  entries: readonly DispositionEntry[],
  restorations: readonly import('#pdv/domain/structures/order-stock-restoration.ts').OrderStockRestoration[],
): readonly import('#pdv/domain/structures/order-stock-restoration.ts').OrderStockRestoration[] {
  let index = 0
  return entries.map(({ disposition, target }) => {
    if (disposition === 'loss') return { ...target, outcome: 'lost' as const }
    const restoration = restorations[index++]
    if (!restoration)
      throw new ConflictError('O resultado da devolução de estoque está incompleto.')
    return restoration
  })
}
