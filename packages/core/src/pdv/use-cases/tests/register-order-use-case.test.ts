import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ComboFaker, OrderFaker } from '#pdv/domain/entities/fakers/index.ts'
import type { PdvDatabase, PdvDatabaseRepositories } from '#pdv/interfaces/index.ts'
import { OrderRegisteredEvent } from '#pdv/domain/events/order-registered-event.ts'
import type { OrderRegistrationInput } from '#pdv/domain/structures/order-registration-input.ts'
import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import type { OrderSequencesRepository } from '#pdv/interfaces/order-sequences-repository.ts'
import type { OrderPreviewTokenService } from '#pdv/interfaces/order-preview-token-service.ts'
import type { OrderPreviewFacts } from '#pdv/domain/structures/order-preview.ts'
import type { OrderCostProvider } from '#pdv/interfaces/order-cost-provider.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import type { StockProvider } from '#pdv/interfaces/stock-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import { RegisterOrderUseCase } from '#pdv/use-cases/register-order-use-case.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'

type Actor = {
  id: string
  name: string
  establishmentId: string
  profile: UserProfile
}

const request = {
  actor: {
    id: 'operator-1',
    name: 'Operator',
    establishmentId: 'establishment-1',
    profile: UserProfile.Operator,
  },
  idempotencyKey: 'key-1',
  previewToken: 'preview-token',
  lines: [
    {
      productId: 'product-1',
      kind: 'resale' as const,
      quantity: 1,
    },
  ],
} satisfies OrderRegistrationInput & { actor: Actor }

const product = {
  productId: 'product-1',
  name: 'Produto',
  kind: 'resale' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  availableQuantity: 10,
  sizes: [],
  resalePrice: 12.5,
  resaleBrands: [],
}

describe('Register Order Use Case', () => {
  let database: MockProxy<PdvDatabase>
  let repositories: PdvDatabaseRepositories
  let catalog: MockProxy<SalesCatalogProvider>
  let datetime: MockProxy<DatetimeProvider>
  let orders: MockProxy<OrdersRepository>
  let orderSequences: MockProxy<OrderSequencesRepository>
  let tokenService: MockProxy<OrderPreviewTokenService>
  let discounts: MockProxy<DiscountsRepository>
  let salesChannels: MockProxy<SalesChannelsRepository>
  let stockProvider: MockProxy<StockProvider>
  let useCase: RegisterOrderUseCase

  beforeEach(() => {
    catalog = mock<SalesCatalogProvider>()
    catalog.findByProductIds.mockResolvedValue([product])
    orders = mock<OrdersRepository>()
    orderSequences = mock<OrderSequencesRepository>()
    tokenService = mock<OrderPreviewTokenService>()
    discounts = mock<DiscountsRepository>()
    salesChannels = mock<SalesChannelsRepository>()
    stockProvider = mock<StockProvider>()
    repositories = {
      salesCatalogProvider: catalog,
      salesChannelsRepository: salesChannels,
      discountsRepository: discounts,
      ordersRepository: orders,
      orderSequencesRepository: orderSequences,
      stockProvider,
      eventsRepository: mock<EventsRepository>(),
    }
    orders.findByIdempotencyKey.mockResolvedValue(undefined)
    discounts.findActive.mockResolvedValue([])
    orderSequences.next.mockResolvedValue(7)
    tokenService.verify.mockReturnValue('valid')
    orders.add.mockResolvedValue(
      OrderFaker.fake({
        id: 'order-1',
        establishmentId: 'establishment-1',
        idempotencyKey: 'key-1',
        sequenceNumber: 7,
      }),
    )
    datetime = mock<DatetimeProvider>()
    datetime.now.mockReturnValue(new Date('2026-01-02T00:00:00.000Z'))
    database = mock<PdvDatabase>()
    database.run.mockImplementation(async (operation) => operation(repositories))
    useCase = new RegisterOrderUseCase(database, datetime, tokenService)
  })

  it('rebuilds current facts, reserves one sequence and synchronously dispatches the event', async () => {
    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'registered',
      replayed: false,
    })

    const salesCatalogProvider = repositories.salesCatalogProvider
    if (!salesCatalogProvider)
      throw new Error('Sales catalog provider was not configured.')
    expect(salesCatalogProvider.findByProductIds).toHaveBeenCalledWith(
      'establishment-1',
      ['product-1'],
    )
    expect(orderSequences.next).toHaveBeenCalledWith('establishment-1')
    expect(stockProvider.consume).toHaveBeenCalledWith(expect.any(OrderRegisteredEvent))
    expect(stockProvider.consume.mock.calls[0][0].payload).toMatchObject({
      actorId: 'operator-1',
      actorName: 'Operator',
      sequenceNumber: 7,
    })
    expect(orders.add.mock.calls[0][0]).toMatchObject({
      createdBy: 'operator-1',
      createdByName: 'Operator',
    })
    expect(orders.add.mock.calls[0][0]).not.toHaveProperty('status')
  })

  it('returns a committed order for a replay without reading current facts or dispatching stock', async () => {
    const existing = OrderFaker.fake({
      id: 'existing-order',
      establishmentId: 'establishment-1',
      idempotencyKey: 'key-1',
      lines: [
        {
          product: {
            productId: 'product-1',
            name: 'Produto',
            kind: 'resale',
          },
          accompaniments: [],
          quantity: 1,
          baseUnitPrice: 12.5,
          finalUnitPrice: 12.5,
          subtotal: 12.5,
          allocatedNetSalesCents: 1250,
          costComponents: [],
          cogsCents: null,
          consumptions: [{ productId: 'product-1', quantity: 1 }],
        },
      ],
    })
    orders.findByIdempotencyKey.mockResolvedValue(existing)

    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'registered',
      replayed: true,
      order: { id: 'existing-order' },
    })
    expect(catalog.findByProductIds).not.toHaveBeenCalled()
    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(stockProvider.consume).not.toHaveBeenCalled()
  })

  it('matches Portion replays by their channel, size and selected accompaniments', async () => {
    const portionRequest = {
      ...request,
      channelId: 'channel-1',
      lines: [
        {
          productId: 'portion-1',
          kind: 'portion' as const,
          quantity: 2,
          sizeId: 'size-1',
          accompanimentIds: ['granola-1', 'banana-1'],
        },
      ],
    }
    const existing = OrderFaker.fake({
      establishmentId: 'establishment-1',
      idempotencyKey: 'key-1',
      channel: {
        channelId: 'channel-1',
        name: 'Entrega',
        percentage: 10,
      },
      lines: [
        {
          product: { productId: 'portion-1', name: 'Açaí', kind: 'portion' },
          size: { sizeId: 'size-1', name: 'Médio', quantity: 1 },
          accompaniments: [
            {
              accompanimentId: 'banana-1',
              name: 'Banana',
              type: 'Extra',
              quantity: 1,
              basePrice: 1,
              finalPrice: 1.1,
            },
            {
              accompanimentId: 'granola-1',
              name: 'Granola',
              type: 'Extra',
              quantity: 1,
              basePrice: 2,
              finalPrice: 2.2,
            },
          ],
          quantity: 2,
          baseUnitPrice: 13,
          finalUnitPrice: 14.3,
          subtotal: 28.6,
          allocatedNetSalesCents: 2860,
          costComponents: [],
          cogsCents: null,
          consumptions: [],
        },
      ],
    })
    orders.findByIdempotencyKey.mockResolvedValue(existing)

    await expect(useCase.execute(portionRequest)).resolves.toMatchObject({
      kind: 'registered',
      replayed: true,
      order: { id: existing.id },
    })
    expect(catalog.findByProductIds).not.toHaveBeenCalled()
    expect(stockProvider.consume).not.toHaveBeenCalled()
  })

  it('rejects a conflicting idempotency key without replaying the stored order', async () => {
    orders.findByIdempotencyKey.mockResolvedValue(
      OrderFaker.fake({
        establishmentId: 'establishment-1',
        idempotencyKey: 'key-1',
      }),
    )

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(catalog.findByProductIds).not.toHaveBeenCalled()
    expect(stockProvider.consume).not.toHaveBeenCalled()
  })

  it('checks the actor and request before opening a database transaction', async () => {
    await expect(
      useCase.execute({
        ...request,
        actor: { ...request.actor, profile: 'customer' as UserProfile },
      }),
    ).rejects.toThrow(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()

    await expect(
      useCase.execute({ ...request, lines: [] } as unknown as typeof request),
    ).rejects.toThrow('O pedido deve possuir entre 1 e 50 itens.')
    expect(database.run).not.toHaveBeenCalled()
  })

  it('requires both idempotency and preview tokens before entering the database', async () => {
    await expect(useCase.execute({ ...request, idempotencyKey: '' })).rejects.toThrow(
      'A chave de idempotência é obrigatória.',
    )
    await expect(useCase.execute({ ...request, previewToken: '' })).rejects.toThrow(
      'O token da prévia é obrigatório.',
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects missing registration providers and does not replay another establishment order', async () => {
    database.run.mockImplementationOnce(async (operation) =>
      operation({ ...repositories, salesCatalogProvider: undefined }),
    )
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)

    database.run.mockImplementationOnce(async (operation) =>
      operation({ ...repositories, stockProvider: undefined }),
    )
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)

    orders.findByIdempotencyKey.mockResolvedValue(
      OrderFaker.fake({
        establishmentId: 'another-establishment',
        idempotencyKey: 'key-1',
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow(NotFoundError)
    expect(catalog.findByProductIds).not.toHaveBeenCalled()
  })

  it('rejects stale preview tokens when their saved facts are missing', async () => {
    tokenService.verify.mockReturnValue('stale')
    tokenService.getFacts.mockReturnValue(undefined)

    await expect(useCase.execute(request)).rejects.toThrow(
      'A prévia do pedido não pode ser atualizada.',
    )
    expect(tokenService.issue).not.toHaveBeenCalled()
    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(orders.add).not.toHaveBeenCalled()
  })

  it('requires an existing active sales channel from the same establishment', async () => {
    const channelRequest = { ...request, channelId: 'channel-1' }
    salesChannels.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(channelRequest)).rejects.toThrow(
      'Canal de venda não encontrado.',
    )

    salesChannels.findById.mockResolvedValue({
      id: 'channel-1',
      establishmentId: 'another-establishment',
      name: 'Entrega',
      percentage: 10,
      status: SalesChannelStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    await expect(useCase.execute(channelRequest)).rejects.toThrow(
      'Canal de venda não encontrado.',
    )

    salesChannels.findById.mockResolvedValue({
      id: 'channel-1',
      establishmentId: 'establishment-1',
      name: 'Entrega',
      percentage: 10,
      status: SalesChannelStatus.Inactive,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    await expect(useCase.execute(channelRequest)).rejects.toThrow(
      'O canal de venda selecionado está inativo.',
    )
    expect(orders.add).not.toHaveBeenCalled()
  })

  it('returns corrective state before reserving or writing when current configuration is invalid', async () => {
    catalog.findByProductIds.mockResolvedValue([])

    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'correction-required',
      invalidConfigurations: [{ productId: 'product-1' }],
    })
    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(orders.add).not.toHaveBeenCalled()
    expect(stockProvider.consume).not.toHaveBeenCalled()
  })

  it('rejects an invalid preview token without disclosing the rebuilt cart', async () => {
    tokenService.verify.mockReturnValue('invalid')

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(BadRequestError)

    expect(tokenService.verify).toHaveBeenCalledWith(
      'preview-token',
      expect.not.objectContaining({ idempotencyKey: 'key-1' }),
      'establishment-1',
      expect.objectContaining({ cart: expect.any(Object) }),
    )
    expect(orders.add).not.toHaveBeenCalled()
    expect(orderSequences.next).not.toHaveBeenCalled()
  })

  it('returns a fresh preview token and catalog change for a stale preview', async () => {
    tokenService.verify.mockReturnValue('stale')
    tokenService.issue.mockReturnValue('fresh-preview-token')
    tokenService.getFacts.mockReturnValue({
      cart: {
        establishmentId: 'establishment-1',
        lines: [],
        discounts: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
      },
    })

    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'repriced',
      previewToken: 'fresh-preview-token',
      changes: expect.arrayContaining([
        {
          kind: 'catalog',
          previous: { label: 'Produto', amount: 0 },
          current: { label: 'Produto', amount: 12.5 },
        },
        {
          kind: 'catalog',
          previous: { label: 'Total do pedido', amount: 0 },
          current: { label: 'Total do pedido', amount: 12.5 },
        },
      ]),
    })

    expect(tokenService.issue).toHaveBeenCalledTimes(1)
    expect(tokenService.issue.mock.calls[0][0]).not.toHaveProperty('idempotencyKey')
    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(orders.add).not.toHaveBeenCalled()
    expect(stockProvider.consume).not.toHaveBeenCalled()
  })

  it('uses current product, size and accompaniment names in stale Portion changes', async () => {
    tokenService.verify.mockReturnValue('stale')
    tokenService.issue.mockReturnValue('fresh-preview-token')
    tokenService.getFacts.mockReturnValue({
      cart: {
        establishmentId: 'establishment-1',
        lines: [
          {
            productId: 'portion-1',
            kind: 'portion',
            quantity: 1,
            sizeId: 'size-1',
            accompanimentIds: ['granola-1'],
            baseUnitPrice: 12,
            finalUnitPrice: 12,
            subtotal: 12,
            consumptions: [
              {
                productId: 'granola-product-1',
                accompanimentId: 'granola-1',
                quantity: 1,
              },
            ],
          },
        ],
        discounts: [],
        subtotal: 12,
        totalDiscount: 0,
        total: 12,
      },
      selectedAccompanimentPrices: [
        {
          productId: 'portion-1',
          sizeId: 'size-1',
          accompanimentId: 'granola-1',
          name: 'Granola',
          basePrice: 2,
        },
      ],
    })
    catalog.findByProductIds.mockResolvedValue([
      {
        productId: 'portion-1',
        name: 'Açaí',
        kind: 'portion',
        stockControl: 'single',
        isActive: true,
        isAvailable: true,
        availableQuantity: 10,
        sizes: [
          {
            sizeId: 'size-1',
            name: 'Médio',
            quantity: 1,
            basePrice: 10,
            isActive: true,
            isAvailable: true,
            accompaniments: [
              {
                accompanimentId: 'granola-1',
                productId: 'granola-product-1',
                name: 'Granola',
                type: 'Complemento',
                quantityPerPortion: 1,
                basePrice: 2.5,
                isActive: true,
                isAvailable: true,
                availableQuantity: 10,
              },
            ],
          },
        ],
        resaleBrands: [],
      },
    ])
    const portionRequest = {
      ...request,
      lines: [
        {
          productId: 'portion-1',
          kind: 'portion',
          quantity: 1,
          sizeId: 'size-1',
          accompanimentIds: ['granola-1'],
        },
      ],
    } satisfies OrderRegistrationInput & { actor: Actor }

    await expect(useCase.execute(portionRequest)).resolves.toMatchObject({
      kind: 'repriced',
      changes: expect.arrayContaining([
        {
          kind: 'catalog',
          cause: 'accompaniment-price',
          previous: { label: 'Granola', amount: 2 },
          current: { label: 'Granola', amount: 2.5 },
        },
        {
          kind: 'catalog',
          previous: { label: 'Açaí · Médio · Granola', amount: 12 },
          current: { label: 'Açaí · Médio · Granola', amount: 12.5 },
        },
        {
          kind: 'catalog',
          previous: { label: 'Total do pedido', amount: 12 },
          current: { label: 'Total do pedido', amount: 12.5 },
        },
      ]),
    })

    const savedFacts = tokenService.getFacts.mock.results[0]?.value as
      | OrderPreviewFacts
      | undefined
    if (!savedFacts) throw new Error('Previous preview facts were not available.')
    tokenService.getFacts.mockReturnValue({
      ...savedFacts,
      selectedAccompanimentPrices: savedFacts.selectedAccompanimentPrices?.map(
        (price) => ({ ...price, basePrice: 2.5 }),
      ),
    })

    const unchangedPriceResult = await useCase.execute(portionRequest)
    expect(unchangedPriceResult).toMatchObject({ kind: 'repriced' })
    if (unchangedPriceResult.kind !== 'repriced')
      throw new Error('The stale preview was not repriced.')
    expect(unchangedPriceResult.changes).not.toContainEqual(
      expect.objectContaining({ cause: 'accompaniment-price' }),
    )
  })

  it('reports actual previous and current channel and Combo monetary facts when stale', async () => {
    tokenService.verify.mockReturnValue('stale')
    tokenService.issue.mockReturnValue('fresh-preview-token')
    tokenService.getFacts.mockReturnValue({
      cart: {
        establishmentId: 'establishment-1',
        lines: [],
        discounts: [
          {
            discountId: 'combo-1',
            name: 'Combo anterior',
            type: 'combo',
            fixedPrice: 10,
            savings: 2.5,
            components: [],
            lineProductIds: ['product-1'],
          },
        ],
        subtotal: 12.5,
        totalDiscount: 2.5,
        total: 10,
      },
      channel: { channelId: 'channel-old', name: 'Balcão', percentage: 0 },
    })

    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'repriced',
      changes: expect.arrayContaining([
        {
          kind: 'channel',
          previous: { label: 'Balcão', amount: 10 },
          current: { label: 'Sem canal', amount: 12.5 },
        },
        {
          kind: 'combo',
          previous: { label: 'Combo anterior', amount: 2.5 },
          current: { label: 'Sem combo', amount: 0 },
        },
      ]),
    })
  })

  it('returns review-required before registering when a valid preview has a shortage', async () => {
    catalog.findByProductIds.mockResolvedValue([{ ...product, isAvailable: false }])

    await expect(useCase.execute(request)).resolves.toMatchObject({
      kind: 'review-required',
      shortages: [{ productId: 'product-1' }],
    })

    expect(tokenService.verify).toHaveBeenCalledWith(
      'preview-token',
      expect.any(Object),
      'establishment-1',
      expect.any(Object),
    )
    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(orders.add).not.toHaveBeenCalled()
  })

  it('reports unavailable Portion size and accompaniment shortages in order', async () => {
    catalog.findByProductIds.mockResolvedValue([
      {
        ...product,
        productId: 'portion-1',
        name: 'Açaí',
        kind: 'portion',
        sizes: [
          {
            sizeId: 'size-1',
            name: 'Médio',
            quantity: 300,
            basePrice: 20,
            isActive: true,
            isAvailable: false,
            availableQuantity: 200,
            accompaniments: [
              {
                accompanimentId: 'granola',
                productId: 'granola-product',
                name: 'Granola',
                type: 'Extra',
                quantityPerPortion: 30,
                basePrice: 2,
                isActive: true,
                isAvailable: false,
                availableQuantity: 10,
              },
            ],
          },
        ],
      },
    ])

    await expect(
      useCase.execute({
        ...request,
        lines: [
          {
            productId: 'portion-1',
            kind: 'portion',
            quantity: 2,
            sizeId: 'size-1',
            accompanimentIds: ['granola'],
          },
        ],
      }),
    ).resolves.toMatchObject({
      kind: 'review-required',
      shortages: [
        {
          productId: 'portion-1',
          productName: 'Açaí',
          requiredQuantity: 600,
          availableQuantity: 200,
        },
        {
          productId: 'granola-product',
          productName: 'Granola',
          requiredQuantity: 60,
          availableQuantity: 10,
        },
      ],
    })

    expect(orderSequences.next).not.toHaveBeenCalled()
    expect(orders.add).not.toHaveBeenCalled()
  })

  it('persists channel, portion, accompaniment and cost snapshots', async () => {
    const portionProduct = {
      productId: 'portion-1',
      name: 'Açaí',
      kind: 'portion' as const,
      stockControl: 'single' as const,
      isActive: true,
      isAvailable: true,
      availableQuantity: 10,
      sizes: [
        {
          sizeId: 'size-1',
          name: 'Médio',
          quantity: 1,
          basePrice: 10,
          isActive: true,
          isAvailable: true,
          accompaniments: [
            {
              accompanimentId: 'granola-1',
              productId: 'granola-product-1',
              name: 'Granola',
              type: 'Extra',
              quantityPerPortion: 1,
              basePrice: 2,
              isActive: true,
              isAvailable: true,
              availableQuantity: 10,
            },
          ],
        },
      ],
      resaleBrands: [],
    }
    catalog.findByProductIds.mockResolvedValue([portionProduct])
    const channel = {
      id: 'channel-1',
      establishmentId: 'establishment-1',
      name: 'Entrega',
      percentage: 10,
      status: SalesChannelStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }
    salesChannels.findById.mockResolvedValue(channel)
    const portionRequest = {
      ...request,
      channelId: channel.id,
      lines: [
        {
          productId: portionProduct.productId,
          kind: 'portion' as const,
          quantity: 1,
          sizeId: 'size-1',
          accompanimentIds: ['granola-1'],
        },
      ],
    }
    const costs = [
      {
        kind: 'portion-base' as const,
        productId: 'portion-1',
        quantity: 1,
        unitCost: 3,
        extendedCostCents: 300,
      },
      {
        kind: 'accompaniment' as const,
        productId: 'granola-product-1',
        accompanimentId: 'granola-1',
        quantity: 1,
        unitCost: 0.5,
        extendedCostCents: 50,
      },
    ]
    const costProvider = mock<OrderCostProvider>()
    costProvider.resolve.mockResolvedValue([{ linePosition: 0, components: costs }])
    useCase = new RegisterOrderUseCase(
      database,
      datetime,
      tokenService,
      catalog,
      costProvider,
      stockProvider,
    )

    await useCase.execute(portionRequest)

    expect(salesChannels.findById).toHaveBeenCalledWith('establishment-1', 'channel-1')
    expect(costProvider.resolve).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      lines: portionRequest.lines,
    })
    const saved = orders.add.mock.calls[0][0]
    expect(saved.channel).toEqual({
      channelId: 'channel-1',
      name: 'Entrega',
      percentage: 10,
    })
    expect(saved.lines[0]).toMatchObject({
      product: { productId: 'portion-1', name: 'Açaí', kind: 'portion' },
      size: { sizeId: 'size-1', name: 'Médio', quantity: 1 },
      accompaniments: [
        {
          accompanimentId: 'granola-1',
          name: 'Granola',
          type: 'Extra',
          quantity: 1,
          basePrice: 2,
          finalPrice: 2.2,
        },
      ],
      baseUnitPrice: 12,
      finalUnitPrice: 13.2,
      subtotal: 13.2,
      costComponents: costs,
      cogsCents: 350,
    })
  })

  it('uses current resale brand names in stale changes and persists the selected brand snapshot', async () => {
    const brandedProduct = {
      ...product,
      name: 'Sorbet',
      stockControl: 'by-brand' as const,
      resalePrice: undefined,
      resaleBrands: [
        {
          brandId: 'brand-1',
          name: 'Vanilla Co.',
          basePrice: 6,
          isActive: true,
          isAvailable: true,
          availableQuantity: 10,
        },
      ],
    }
    catalog.findByProductIds.mockResolvedValue([brandedProduct])
    const brandedRequest = {
      ...request,
      lines: [
        {
          productId: 'product-1',
          kind: 'resale' as const,
          quantity: 1,
          brandId: 'brand-1',
        },
      ],
    }
    tokenService.verify.mockReturnValue('stale')
    tokenService.getFacts.mockReturnValue({
      cart: {
        establishmentId: 'establishment-1',
        lines: [],
        discounts: [],
        subtotal: 0,
        totalDiscount: 0,
        total: 0,
      },
    })

    await expect(useCase.execute(brandedRequest)).resolves.toMatchObject({
      kind: 'repriced',
      changes: expect.arrayContaining([
        {
          kind: 'catalog',
          previous: { label: 'Sorbet · Vanilla Co.', amount: 0 },
          current: { label: 'Sorbet · Vanilla Co.', amount: 6 },
        },
      ]),
    })

    tokenService.verify.mockReturnValue('valid')
    await useCase.execute(brandedRequest)
    expect(orders.add.mock.calls[0][0].lines[0]).toMatchObject({
      product: { productId: 'product-1', name: 'Sorbet', kind: 'resale' },
      brand: { brandId: 'brand-1', name: 'Vanilla Co.' },
      baseUnitPrice: 6,
      finalUnitPrice: 6,
      subtotal: 6,
      cogsCents: 0,
    })
  })

  it('allocates every cent of a fixed-price Combo across its ordered lines', async () => {
    const products = ['product-a', 'product-b', 'product-c'].map((productId) => ({
      ...product,
      productId,
      resalePrice: 0.34,
    }))
    catalog.findByProductIds.mockResolvedValue(products)
    const combo = ComboFaker.fake({
      id: 'combo-1',
      establishmentId: 'establishment-1',
      name: 'Trio',
      fixedPrice: 1,
      components: products.map(({ productId }) => ({
        kind: 'resale' as const,
        productId,
        quantity: 1,
      })),
    })
    discounts.findActive.mockResolvedValue([combo])
    const threeItemsRequest = {
      ...request,
      lines: products.map(({ productId }) => ({
        productId,
        kind: 'resale' as const,
        quantity: 1,
      })),
    }

    await useCase.execute(threeItemsRequest)

    const saved = orders.add.mock.calls[0][0]
    expect(saved.subtotal).toBe(1.02)
    expect(saved.totalDiscount).toBe(0.02)
    expect(saved.total).toBe(1)
    expect(saved.discounts).toEqual([
      {
        discount: {
          discountId: 'combo-1',
          name: 'Trio',
          type: 'combo',
          fixedPrice: 1,
          components: combo.components,
        },
        savings: 0.02,
        lineProductIds: ['product-a', 'product-b', 'product-c'],
      },
    ])
    expect(saved.lines.map((line) => line.allocatedNetSalesCents)).toEqual([33, 33, 34])
    expect(stockProvider.consume.mock.calls[0][0].payload.consumptions).toEqual([
      { productId: 'product-a', quantity: 1 },
      { productId: 'product-b', quantity: 1 },
      { productId: 'product-c', quantity: 1 },
    ])
  })

  it('consolidates repeated stock consumptions before dispatching the order event', async () => {
    const repeatedLineRequest = {
      ...request,
      lines: [
        { productId: 'product-1', kind: 'resale' as const, quantity: 1 },
        { productId: 'product-1', kind: 'resale' as const, quantity: 1 },
      ],
    }

    await useCase.execute(repeatedLineRequest)

    expect(stockProvider.consume.mock.calls[0][0].payload.consumptions).toEqual([
      { productId: 'product-1', quantity: 2 },
    ])
    expect(orders.add.mock.calls[0][0].lines.map((line) => line.subtotal)).toEqual([
      12.5, 12.5,
    ])
  })

  it('lets event failures escape so the transaction boundary can roll back all writes', async () => {
    stockProvider.consume.mockRejectedValue(new Error('provider failed'))

    await expect(useCase.execute(request)).rejects.toThrow('provider failed')
    expect(orders.add).toHaveBeenCalledTimes(1)
  })
})
