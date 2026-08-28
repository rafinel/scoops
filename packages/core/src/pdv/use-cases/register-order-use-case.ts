import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Order } from '#pdv/domain/entities/order.ts'
import { OrderRegisteredEvent } from '#pdv/domain/events/order-registered-event.ts'
import type { AccompanimentSnapshot } from '#pdv/domain/structures/accompaniment-snapshot.ts'
import type { BrandSnapshot } from '#pdv/domain/structures/brand-snapshot.ts'
import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { CartLine } from '#pdv/domain/structures/cart-line.ts'
import type { DiscountSnapshot } from '#pdv/domain/structures/discount-snapshot.ts'
import type { OrderDetails } from '#pdv/domain/structures/order-details.ts'
import type {
  OrderPreviewFacts,
  OrderPreviewInput,
} from '#pdv/domain/structures/order-preview.ts'
import type { OrderRegistrationChange } from '#pdv/domain/structures/order-registration-change.ts'
import type { OrderLine } from '#pdv/domain/structures/order-line.ts'
import type { OrderRegistrationInput } from '#pdv/domain/structures/order-registration-input.ts'
import type { OrderRegistrationResult } from '#pdv/domain/structures/order-registration-result.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'
import type { ProductSizeSnapshot } from '#pdv/domain/structures/product-size-snapshot.ts'
import type { ProductSnapshot } from '#pdv/domain/structures/product-snapshot.ts'
import type { SalesChannelSnapshot } from '#pdv/domain/structures/sales-channel-snapshot.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { PdvDatabaseScope } from '#pdv/interfaces/pdv-database.ts'
import type { OrderPreviewTokenService } from '#pdv/interfaces/order-preview-token-service.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import {
  adjustUnitPrice,
  rebuildCartWithIssues,
  validateOrderRegistrationInput,
} from '#pdv/use-cases/order-pricing.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = OrderRegistrationInput & {
  readonly actor: {
    readonly id: string
    readonly name: string
    readonly establishmentId: string
    readonly profile: UserProfile
  }
}

export class RegisterOrderUseCase implements UseCase<Request, OrderRegistrationResult> {
  constructor(
    private readonly database: PdvDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly tokenService: OrderPreviewTokenService,
  ) {}

  async execute(request: Request): Promise<OrderRegistrationResult> {
    this.validateActor(request.actor.profile)
    validateOrderRegistrationInput(request)
    return this.database.run(async (scope) => {
      const replay = await scope.ordersRepository.findByIdempotencyKey(
        request.actor.establishmentId,
        request.idempotencyKey,
      )
      if (replay && replay.establishmentId !== request.actor.establishmentId)
        throw new NotFoundError('Pedido não encontrado.')
      if (replay)
        if (!this.matchesReplay(replay, request))
          throw new ConflictError('A chave de idempotência já foi usada em outro pedido.')
      if (replay)
        return {
          kind: 'registered',
          order: this.toOrderDetails(replay),
          replayed: true,
        }

      const products = await scope.salesCatalogProvider.findByProductIds(
        request.actor.establishmentId,
        request.lines.map((line) => line.productId),
      )
      const channel = await this.findChannel(scope, request)
      const combos = await scope.discountsRepository.findActive(
        request.actor.establishmentId,
      )
      const rebuilt = rebuildCartWithIssues(
        request,
        products,
        channel,
        combos,
        request.actor.establishmentId,
      )
      const previewInput = this.toPreviewInput(request)
      const facts = this.toFacts(rebuilt.cart, channel)
      const verification = this.tokenService.verify(
        request.previewToken,
        previewInput,
        request.actor.establishmentId,
        facts,
      )
      if (verification === 'invalid')
        throw new BadRequestError('A prévia do pedido expirou ou não é válida.')

      const previousFacts =
        verification === 'stale'
          ? this.tokenService.getFacts(request.previewToken)
          : undefined
      if (verification === 'stale' && !previousFacts)
        throw new BadRequestError('A prévia do pedido não pode ser atualizada.')
      const changes = previousFacts
        ? this.staleChanges(previousFacts, facts)
        : ([] as const)
      const outcome = this.resolveIssues(rebuilt, changes)
      if (outcome) return outcome
      if (verification === 'stale')
        return {
          kind: 'repriced',
          recalculatedCart: rebuilt.cart,
          previewToken: this.tokenService.issue(
            previewInput,
            request.actor.establishmentId,
            facts,
          ),
          changes,
        }

      const sequenceNumber = await scope.orderSequencesRepository.next(
        request.actor.establishmentId,
      )
      const order = await scope.ordersRepository.add(
        this.toOrderCreate(request, rebuilt.cart, products, channel),
      )
      const occurredAt = this.datetimeProvider.now()
      const event = new OrderRegisteredEvent({
        orderId: order.id,
        establishmentId: order.establishmentId,
        sequenceNumber,
        createdAt: order.createdAt,
        actorId: request.actor.id,
        actorName: request.actor.name,
        occurredAt,
        consumptions: consolidateConsumptions(rebuilt.cart),
      })
      await scope.stockConsumer.consume(event)

      return {
        kind: 'registered',
        order: this.toOrderDetails(order),
        replayed: false,
      }
    })
  }

  private async findChannel(scope: PdvDatabaseScope, request: Request) {
    if (!request.channelId) return undefined
    const channel = await scope.salesChannelsRepository.findById(
      request.actor.establishmentId,
      request.channelId,
    )
    if (!channel || channel.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Canal de venda não encontrado.')
    if (channel.status !== SalesChannelStatus.Active)
      throw new BadRequestError('O canal de venda selecionado está inativo.')
    return channel
  }

  private resolveIssues(
    issues: ReturnType<typeof rebuildCartWithIssues>,
    changes: readonly OrderRegistrationChange[],
  ): OrderRegistrationResult | undefined {
    if (issues.invalidConfigurations.length > 0)
      return {
        kind: 'correction-required',
        invalidConfigurations: issues.invalidConfigurations,
        shortages: issues.shortages,
        changes,
      }
    if (issues.shortages.length > 0)
      return {
        kind: 'review-required',
        shortages: issues.shortages,
        changes,
      }
    return undefined
  }

  private staleChanges(
    previous: OrderPreviewFacts,
    current: OrderPreviewFacts,
  ): readonly OrderRegistrationChange[] {
    const changes: OrderRegistrationChange[] = []
    if (
      JSON.stringify(previous.channel ?? null) !== JSON.stringify(current.channel ?? null)
    )
      changes.push({
        kind: 'channel',
        previous: {
          label: previous.channel?.name ?? 'Sem canal',
          amount: previous.cart.total,
        },
        current: {
          label: current.channel?.name ?? 'Sem canal',
          amount: current.cart.total,
        },
      })

    if (this.serializeDiscounts(previous.cart) !== this.serializeDiscounts(current.cart))
      changes.push({
        kind: 'combo',
        previous: {
          label: this.discountLabel(previous.cart),
          amount: previous.cart.totalDiscount,
        },
        current: {
          label: this.discountLabel(current.cart),
          amount: current.cart.totalDiscount,
        },
      })

    if (this.serializeCatalog(previous.cart) !== this.serializeCatalog(current.cart))
      changes.push({
        kind: 'catalog',
        previous: {
          label: this.catalogLabel(previous.cart),
          amount: previous.cart.subtotal,
        },
        current: {
          label: this.catalogLabel(current.cart),
          amount: current.cart.subtotal,
        },
      })

    if (changes.length === 0)
      changes.push({
        kind: 'catalog',
        previous: {
          label: this.catalogLabel(previous.cart),
          amount: previous.cart.total,
        },
        current: { label: this.catalogLabel(current.cart), amount: current.cart.total },
      })
    return changes
  }

  private serializeDiscounts(cart: Cart): string {
    return JSON.stringify(
      [...cart.discounts]
        .sort((left, right) => left.discountId.localeCompare(right.discountId))
        .map((discount) => ({
          discountId: discount.discountId,
          fixedPrice: discount.fixedPrice,
          savings: discount.savings,
          lineProductIds: [...discount.lineProductIds].sort(),
        })),
    )
  }

  private serializeCatalog(cart: Cart): string {
    return JSON.stringify(
      [...cart.lines]
        .sort((left, right) => left.productId.localeCompare(right.productId))
        .map((line) => ({
          productId: line.productId,
          kind: line.kind,
          quantity: line.quantity,
          sizeId: line.sizeId ?? null,
          brandId: line.brandId ?? null,
          accompanimentIds: [...line.accompanimentIds].sort(),
          baseUnitPrice: line.baseUnitPrice,
          consumptions: [...line.consumptions].sort((left, right) =>
            JSON.stringify(left).localeCompare(JSON.stringify(right)),
          ),
        })),
    )
  }

  private discountLabel(cart: Cart): string {
    return (
      [...cart.discounts]
        .sort((left, right) => left.discountId.localeCompare(right.discountId))
        .map((discount) => discount.name)
        .join(', ') || 'Sem combo'
    )
  }

  private catalogLabel(cart: Cart): string {
    return (
      [...cart.lines]
        .sort((left, right) => left.productId.localeCompare(right.productId))
        .map((line) => `${line.productId} (${line.baseUnitPrice.toFixed(2)})`)
        .join(', ') || 'Catálogo vazio'
    )
  }

  private matchesReplay(order: Order, request: Request): boolean {
    if ((order.channel?.channelId ?? undefined) !== request.channelId) return false
    const storedLines = order.lines
      .map((line) => ({
        productId: line.product.productId,
        kind: line.product.kind,
        quantity: line.quantity,
        sizeId: line.size?.sizeId,
        brandId: line.brand?.brandId,
        accompanimentIds: line.accompaniments
          .map((accompaniment) => accompaniment.accompanimentId)
          .sort(),
      }))
      .sort((left, right) => left.productId.localeCompare(right.productId))
    const submittedLines = request.lines
      .map((line) => ({
        productId: line.productId,
        kind: line.kind,
        quantity: line.quantity,
        sizeId: line.kind === 'portion' ? line.sizeId : undefined,
        brandId: line.kind === 'resale' ? line.brandId : undefined,
        accompanimentIds:
          line.kind === 'portion' ? [...line.accompanimentIds].sort() : [],
      }))
      .sort((left, right) => left.productId.localeCompare(right.productId))
    return JSON.stringify(storedLines) === JSON.stringify(submittedLines)
  }

  private toPreviewInput(request: Request): OrderPreviewInput {
    return {
      ...(request.channelId ? { channelId: request.channelId } : {}),
      lines: request.lines,
    }
  }

  private toFacts(
    cart: Cart,
    channel: Awaited<ReturnType<RegisterOrderUseCase['findChannel']>>,
  ): OrderPreviewFacts {
    if (!channel) return { cart }
    return {
      cart,
      channel: {
        channelId: channel.id,
        name: channel.name,
        percentage: channel.percentage,
      },
    }
  }

  private toOrderCreate(
    request: Request,
    cart: Cart,
    products: readonly SalesCatalogProduct[],
    channel: Awaited<ReturnType<RegisterOrderUseCase['findChannel']>>,
  ): Omit<Order, 'id' | 'sequenceNumber' | 'createdAt'> {
    const productsById = new Map(products.map((product) => [product.productId, product]))
    const channelSnapshot: SalesChannelSnapshot | undefined = channel
      ? {
          channelId: channel.id,
          name: channel.name,
          percentage: channel.percentage,
        }
      : undefined
    return {
      establishmentId: request.actor.establishmentId,
      idempotencyKey: request.idempotencyKey,
      createdBy: request.actor.id,
      ...(channelSnapshot ? { channel: channelSnapshot } : {}),
      lines: cart.lines.map((line) =>
        this.toOrderLine(
          line,
          productsById.get(line.productId),
          channel?.percentage ?? 0,
        ),
      ),
      discounts: cart.discounts.map((discount) => ({
        discount: {
          discountId: discount.discountId,
          name: discount.name,
          type: discount.type,
          fixedPrice: discount.fixedPrice,
          components: discount.components,
        } satisfies DiscountSnapshot,
        savings: discount.savings,
        lineProductIds: discount.lineProductIds,
      })),
      subtotal: cart.subtotal,
      totalDiscount: cart.totalDiscount,
      total: cart.total,
    }
  }

  private toOrderLine(
    line: CartLine,
    product: SalesCatalogProduct | undefined,
    channelPercentage: number,
  ): OrderLine {
    const size =
      line.kind === 'portion'
        ? product?.sizes.find((candidate) => candidate.sizeId === line.sizeId)
        : undefined
    const brand =
      line.kind === 'resale' && line.brandId
        ? product?.resaleBrands.find((candidate) => candidate.brandId === line.brandId)
        : undefined
    const productSnapshot: ProductSnapshot = {
      productId: line.productId,
      name: product?.name ?? 'Produto não encontrado',
      kind: line.kind,
    }
    const brandSnapshot: BrandSnapshot | undefined = brand
      ? { brandId: brand.brandId, name: brand.name }
      : undefined
    const sizeSnapshot: ProductSizeSnapshot | undefined = size
      ? { sizeId: size.sizeId, name: size.name, quantity: size.quantity }
      : undefined
    const accompaniments: AccompanimentSnapshot[] = size
      ? size.accompaniments
          .filter((accompaniment) =>
            line.accompanimentIds.includes(accompaniment.accompanimentId),
          )
          .map((accompaniment) => ({
            accompanimentId: accompaniment.accompanimentId,
            name: accompaniment.name,
            type: accompaniment.type,
            quantity: accompaniment.quantityPerPortion,
            basePrice: accompaniment.basePrice,
            finalPrice: adjustUnitPrice(accompaniment.basePrice, channelPercentage),
          }))
      : []
    return {
      product: productSnapshot,
      ...(brandSnapshot ? { brand: brandSnapshot } : {}),
      ...(sizeSnapshot ? { size: sizeSnapshot } : {}),
      accompaniments,
      quantity: line.quantity,
      baseUnitPrice: line.baseUnitPrice,
      finalUnitPrice: line.finalUnitPrice,
      subtotal: line.subtotal,
      consumptions: line.consumptions,
    }
  }

  private toOrderDetails(order: Order): OrderDetails {
    return order
  }

  private validateActor(profile: UserProfile): void {
    if (profile !== UserProfile.Manager && profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem registrar pedidos.',
      )
  }
}

function consolidateConsumptions(cart: Cart): readonly StockConsumption[] {
  const totals = new Map<string, StockConsumption>()
  for (const consumption of cart.lines.flatMap((line) => line.consumptions)) {
    const key = `${consumption.productId}:${consumption.brandId ?? ''}:${consumption.accompanimentId ?? ''}`
    const current = totals.get(key)
    if (current)
      totals.set(key, { ...current, quantity: current.quantity + consumption.quantity })
    else totals.set(key, { ...consumption })
  }
  return [...totals.values()]
}
