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
import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { PdvDatabaseRepositories } from '#pdv/interfaces/pdv-database.ts'
import type { OrderPreviewTokenService } from '#pdv/interfaces/order-preview-token-service.ts'
import type { OrderCostProvider } from '#pdv/interfaces/order-cost-provider.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { StockProvider } from '#pdv/interfaces/stock-provider.ts'
import { OrderCartPricingStrategy } from '#pdv/domain/strategies/order-cart-pricing-strategy.ts'
import { OrderMoneyRoundingStrategy } from '#pdv/domain/strategies/order-money-rounding-strategy.ts'
import { OrderPreviewAccompanimentPriceSnapshotStrategy } from '#pdv/domain/strategies/order-preview-accompaniment-price-snapshot-strategy.ts'
import { OrderPreviewInputValidationStrategy } from '#pdv/domain/strategies/order-preview-input-validation-strategy.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
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

type RegistrationProviders = {
  readonly catalog: SalesCatalogProvider
  readonly cost?: OrderCostProvider
  readonly stock: StockProvider
}

type RegistrationRebuild = {
  readonly products: readonly SalesCatalogProduct[]
  readonly channel: SalesChannel | undefined
  readonly pricing: ReturnType<OrderCartPricingStrategy['execute']>
  readonly previewInput: OrderPreviewInput
  readonly facts: OrderPreviewFacts
}

export class RegisterOrderUseCase implements UseCase<Request, OrderRegistrationResult> {
  private readonly cartPricing = new OrderCartPricingStrategy()
  private readonly moneyRounding = new OrderMoneyRoundingStrategy()
  private readonly accompanimentPriceSnapshot =
    new OrderPreviewAccompanimentPriceSnapshotStrategy()
  private readonly inputValidation = new OrderPreviewInputValidationStrategy()

  constructor(
    private readonly database: PdvDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly tokenService: OrderPreviewTokenService,
    private readonly salesCatalogProvider?: SalesCatalogProvider,
    private readonly orderCostProvider?: OrderCostProvider,
    private readonly stockProvider?: StockProvider,
  ) {}

  async execute(request: Request): Promise<OrderRegistrationResult> {
    this.validateActor(request.actor.profile)
    this.validateRegistrationInput(request)
    return this.database.run((repositories) =>
      this.registerWithinScope(request, repositories),
    )
  }

  private async registerWithinScope(
    request: Request,
    repositories: PdvDatabaseRepositories,
  ): Promise<OrderRegistrationResult> {
    const providers = this.resolveProviders(repositories)
    const replay = await this.findReplay(request, repositories.ordersRepository)
    if (replay) return replay

    const rebuilt = await this.rebuildRegistration(
      request,
      repositories,
      providers.catalog,
    )
    const staleResult = this.resolveStalePreview(request, rebuilt)
    if (staleResult) return staleResult

    return this.persistOrder(request, rebuilt, repositories, providers)
  }

  private resolveProviders(repositories: PdvDatabaseRepositories): RegistrationProviders {
    const catalog = this.salesCatalogProvider ?? repositories.salesCatalogProvider
    const stock = this.stockProvider ?? repositories.stockProvider
    if (!catalog || !stock)
      throw new ConflictError(
        'As dependências do registro de pedido não estão disponíveis.',
      )

    return {
      catalog,
      stock,
      cost: this.orderCostProvider ?? repositories.orderCostProvider,
    }
  }

  private async findReplay(
    request: Request,
    ordersRepository: PdvDatabaseRepositories['ordersRepository'],
  ): Promise<OrderRegistrationResult | undefined> {
    const replay = await ordersRepository.findByIdempotencyKey(
      request.actor.establishmentId,
      request.idempotencyKey,
    )
    if (!replay) return undefined
    if (replay.establishmentId !== request.actor.establishmentId)
      throw new NotFoundError('Pedido não encontrado.')
    if (!this.matchesReplay(replay, request))
      throw new ConflictError('A chave de idempotência já foi usada em outro pedido.')

    return {
      kind: 'registered',
      order: this.toOrderDetails(replay),
      replayed: true,
    }
  }

  private async rebuildRegistration(
    request: Request,
    repositories: PdvDatabaseRepositories,
    catalogProvider: SalesCatalogProvider,
  ): Promise<RegistrationRebuild> {
    const products = await catalogProvider.findByProductIds(
      request.actor.establishmentId,
      request.lines.map((line) => line.productId),
    )
    const channel = await this.findChannel(repositories, request)
    const combos = await repositories.discountsRepository.findActive(
      request.actor.establishmentId,
    )
    const pricing = this.cartPricing.execute({
      input: request,
      products,
      channel,
      combos,
      establishmentId: request.actor.establishmentId,
    })
    const previewInput = this.toPreviewInput(request)

    return {
      products,
      channel,
      pricing,
      previewInput,
      facts: this.toFacts(pricing.cart, channel, products),
    }
  }

  private resolveStalePreview(
    request: Request,
    rebuilt: RegistrationRebuild,
  ): OrderRegistrationResult | undefined {
    const verification = this.tokenService.verify(
      request.previewToken,
      rebuilt.previewInput,
      request.actor.establishmentId,
      rebuilt.facts,
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
      ? this.staleChanges(previousFacts, rebuilt.facts, rebuilt.products)
      : []
    const outcome = this.resolveIssues(rebuilt.pricing, changes)
    if (outcome) return outcome
    if (verification !== 'stale') return undefined

    return {
      kind: 'repriced',
      recalculatedCart: rebuilt.pricing.cart,
      previewToken: this.tokenService.issue(
        rebuilt.previewInput,
        request.actor.establishmentId,
        rebuilt.facts,
      ),
      changes,
    }
  }

  private async persistOrder(
    request: Request,
    rebuilt: RegistrationRebuild,
    repositories: PdvDatabaseRepositories,
    providers: RegistrationProviders,
  ): Promise<OrderRegistrationResult> {
    const sequenceNumber = await repositories.orderSequencesRepository.next(
      request.actor.establishmentId,
    )
    const costs = providers.cost
      ? await providers.cost.resolve({
          establishmentId: request.actor.establishmentId,
          lines: request.lines,
        })
      : []
    const order = await repositories.ordersRepository.add(
      this.toOrderCreate(
        request,
        rebuilt.pricing.cart,
        rebuilt.products,
        rebuilt.channel,
        costs,
      ),
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
      consumptions: consolidateConsumptions(rebuilt.pricing.cart),
    })
    await providers.stock.consume(event)

    return {
      kind: 'registered',
      order: this.toOrderDetails(order),
      replayed: false,
    }
  }

  private async findChannel(scope: PdvDatabaseRepositories, request: Request) {
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
    issues: ReturnType<OrderCartPricingStrategy['execute']>,
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
    products: readonly SalesCatalogProduct[],
  ): readonly OrderRegistrationChange[] {
    const changes = [
      ...this.channelChanges(previous, current),
      ...this.comboChanges(previous, current),
      ...this.catalogChanges(previous, current, products),
    ]
    return changes.length > 0 ? changes : [this.totalChange(previous, current)]
  }

  private channelChanges(
    previous: OrderPreviewFacts,
    current: OrderPreviewFacts,
  ): readonly OrderRegistrationChange[] {
    if (
      JSON.stringify(previous.channel ?? null) === JSON.stringify(current.channel ?? null)
    )
      return []
    return [
      {
        kind: 'channel',
        previous: {
          label: previous.channel?.name ?? 'Sem canal',
          amount: previous.cart.total,
        },
        current: {
          label: current.channel?.name ?? 'Sem canal',
          amount: current.cart.total,
        },
      },
    ]
  }

  private comboChanges(
    previous: OrderPreviewFacts,
    current: OrderPreviewFacts,
  ): readonly OrderRegistrationChange[] {
    if (this.serializeDiscounts(previous.cart) === this.serializeDiscounts(current.cart))
      return []
    return [
      {
        kind: 'combo',
        previous: {
          label: this.discountLabel(previous.cart),
          amount: previous.cart.totalDiscount,
        },
        current: {
          label: this.discountLabel(current.cart),
          amount: current.cart.totalDiscount,
        },
      },
    ]
  }

  private catalogChanges(
    previous: OrderPreviewFacts,
    current: OrderPreviewFacts,
    products: readonly SalesCatalogProduct[],
  ): readonly OrderRegistrationChange[] {
    const accompanimentChanges = this.accompanimentPriceChanges(
      previous.selectedAccompanimentPrices ?? [],
      current.selectedAccompanimentPrices ?? [],
    )
    const catalogChanged =
      this.serializeCatalog(previous.cart) !== this.serializeCatalog(current.cart)
    if (!catalogChanged && accompanimentChanges.length === 0) return []

    return [
      ...accompanimentChanges,
      ...this.catalogLineChanges(previous.cart, current.cart, products),
      this.totalChange(previous, current),
    ]
  }

  private totalChange(
    previous: OrderPreviewFacts,
    current: OrderPreviewFacts,
  ): OrderRegistrationChange {
    return {
      kind: 'catalog',
      previous: { label: 'Total do pedido', amount: previous.cart.total },
      current: { label: 'Total do pedido', amount: current.cart.total },
    }
  }

  private accompanimentPriceChanges(
    previousPrices: NonNullable<OrderPreviewFacts['selectedAccompanimentPrices']>,
    currentPrices: NonNullable<OrderPreviewFacts['selectedAccompanimentPrices']>,
  ): readonly OrderRegistrationChange[] {
    const keyOf = (price: (typeof previousPrices)[number]) =>
      JSON.stringify([price.productId, price.sizeId, price.accompanimentId])
    const previousByKey = new Map(previousPrices.map((price) => [keyOf(price), price]))
    const currentByKey = new Map(currentPrices.map((price) => [keyOf(price), price]))
    const changes: OrderRegistrationChange[] = []

    for (const key of [...previousByKey.keys()].sort()) {
      const previous = previousByKey.get(key)
      const current = currentByKey.get(key)
      if (!previous || !current || previous.basePrice === current.basePrice) continue

      changes.push({
        kind: 'catalog',
        cause: 'accompaniment-price',
        previous: { label: previous.name, amount: previous.basePrice },
        current: { label: current.name, amount: current.basePrice },
      })
    }

    return changes
  }

  private catalogLineChanges(
    previous: Cart,
    current: Cart,
    products: readonly SalesCatalogProduct[],
  ): readonly OrderRegistrationChange[] {
    const previousByKey = this.linesByCatalogKey(previous.lines)
    const currentByKey = this.linesByCatalogKey(current.lines)
    const keys = [...new Set([...previousByKey.keys(), ...currentByKey.keys()])].sort()
    const changes: OrderRegistrationChange[] = []

    for (const key of keys) {
      changes.push(
        ...this.catalogLineChangesForKey(
          previousByKey.get(key) ?? [],
          currentByKey.get(key) ?? [],
          products,
        ),
      )
    }

    return changes
  }

  private catalogLineChangesForKey(
    previousLines: readonly CartLine[],
    currentLines: readonly CartLine[],
    products: readonly SalesCatalogProduct[],
  ): readonly OrderRegistrationChange[] {
    const changes: OrderRegistrationChange[] = []
    const lineCount = Math.max(previousLines.length, currentLines.length)
    for (let index = 0; index < lineCount; index += 1) {
      const change = this.catalogLineChange(
        previousLines[index],
        currentLines[index],
        products,
      )
      if (change) changes.push(change)
    }
    return changes
  }

  private catalogLineChange(
    previousLine: CartLine | undefined,
    currentLine: CartLine | undefined,
    products: readonly SalesCatalogProduct[],
  ): OrderRegistrationChange | undefined {
    if (
      previousLine &&
      currentLine &&
      this.serializeCatalogLine(previousLine) === this.serializeCatalogLine(currentLine)
    ) {
      return undefined
    }

    const productId = currentLine?.productId ?? previousLine?.productId ?? ''
    return {
      kind: 'catalog',
      previous: {
        label: this.catalogLineLabel(previousLine ?? currentLine, products) || productId,
        amount: previousLine?.subtotal ?? 0,
      },
      current: {
        label: this.catalogLineLabel(currentLine ?? previousLine, products) || productId,
        amount: currentLine?.subtotal ?? 0,
      },
    }
  }

  private catalogLineLabel(
    line: CartLine | undefined,
    products: readonly SalesCatalogProduct[],
  ): string {
    if (!line) return ''
    const product = products.find((candidate) => candidate.productId === line.productId)
    if (!product) return line.productId
    const labels = [product.name]
    if (line.kind === 'portion') {
      const size = product.sizes.find((candidate) => candidate.sizeId === line.sizeId)
      labels.push(size?.name ?? line.sizeId ?? '')
      const selectedAccompaniments = line.accompanimentIds.map(
        (accompanimentId) =>
          size?.accompaniments.find(
            (accompaniment) => accompaniment.accompanimentId === accompanimentId,
          )?.name ?? accompanimentId,
      )
      labels.push(...selectedAccompaniments)
    } else if (line.brandId) {
      labels.push(
        product.resaleBrands.find((brand) => brand.brandId === line.brandId)?.name ??
          line.brandId,
      )
    }
    return labels.filter((label) => label.length > 0).join(' · ')
  }

  private linesByCatalogKey(lines: readonly CartLine[]): Map<string, CartLine[]> {
    const result = new Map<string, CartLine[]>()
    for (const line of lines) {
      const key = JSON.stringify([
        line.productId,
        line.kind,
        line.kind === 'portion' ? line.sizeId : null,
        line.kind === 'resale' ? (line.brandId ?? null) : null,
        line.kind === 'portion' ? [...line.accompanimentIds].sort() : [],
      ])
      const matching = result.get(key) ?? []
      matching.push(line)
      result.set(key, matching)
    }
    return result
  }

  private serializeCatalogLine(line: CartLine): string {
    return JSON.stringify({
      quantity: line.quantity,
      baseUnitPrice: line.baseUnitPrice,
      finalUnitPrice: line.finalUnitPrice,
      subtotal: line.subtotal,
      consumptions: [...line.consumptions].sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      ),
    })
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
    products: readonly SalesCatalogProduct[],
  ): OrderPreviewFacts {
    return {
      cart,
      ...(channel
        ? {
            channel: {
              channelId: channel.id,
              name: channel.name,
              percentage: channel.percentage,
            },
          }
        : {}),
      selectedAccompanimentPrices: this.accompanimentPriceSnapshot.execute({
        cart,
        products,
      }),
    }
  }

  private toOrderCreate(
    request: Request,
    cart: Cart,
    products: readonly SalesCatalogProduct[],
    channel: Awaited<ReturnType<RegisterOrderUseCase['findChannel']>>,
    costs: readonly {
      readonly linePosition: number
      readonly components: readonly import('#pdv/domain/structures/order-cost-component-snapshot.ts').OrderCostComponentSnapshot[]
    }[],
  ): Omit<Order, 'id' | 'sequenceNumber' | 'status' | 'cancellation' | 'createdAt'> {
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
      createdByName: request.actor.name,
      ...(channelSnapshot ? { channel: channelSnapshot } : {}),
      lines: cart.lines.map((line, index) =>
        this.toOrderLine(
          line,
          productsById.get(line.productId),
          channel?.percentage ?? 0,
          costs.find((cost) => cost.linePosition === index)?.components ?? [],
          allocateNetSalesCents(cart.lines, cart.total, index),
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
    costComponents: readonly import('#pdv/domain/structures/order-cost-component-snapshot.ts').OrderCostComponentSnapshot[],
    allocatedNetSalesCents: number,
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
            finalPrice: this.moneyRounding.execute({
              amount: accompaniment.basePrice,
              percentage: channelPercentage,
            }),
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
      allocatedNetSalesCents,
      costComponents,
      cogsCents: costComponents.every((component) => component.extendedCostCents !== null)
        ? costComponents.reduce(
            (total, component) => total + (component.extendedCostCents ?? 0),
            0,
          )
        : null,
      consumptions: line.consumptions,
    }
  }

  private toOrderDetails(order: Order): OrderDetails {
    return order
  }

  private validateRegistrationInput(input: OrderRegistrationInput): void {
    this.inputValidation.execute(input)
    if (!input.idempotencyKey || typeof input.idempotencyKey !== 'string')
      throw new BadRequestError('A chave de idempotência é obrigatória.')
    if (!input.previewToken || typeof input.previewToken !== 'string')
      throw new BadRequestError('O token da prévia é obrigatório.')
  }

  private validateActor(profile: UserProfile): void {
    if (profile !== UserProfile.Manager && profile !== UserProfile.Operator)
      throw new AuthorizationError(
        'Somente gestores e operadores podem registrar pedidos.',
      )
  }
}

function allocateNetSalesCents(
  lines: readonly CartLine[],
  total: number,
  index: number,
): number {
  const totalCents = Math.round(total * 100)
  const weights = lines.map((line) => Math.max(0, line.subtotal))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
  if (weightTotal === 0) return index === lines.length - 1 ? totalCents : 0
  const allocatedBefore = lines
    .slice(0, index)
    .reduce(
      (sum, line) =>
        sum + Math.floor((Math.max(0, line.subtotal) / weightTotal) * totalCents),
      0,
    )
  if (index === lines.length - 1) return totalCents - allocatedBefore
  return Math.floor((Math.max(0, lines[index].subtotal) / weightTotal) * totalCents)
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
