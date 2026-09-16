import { UserProfile } from '@scoops/core/identity/domain/structures'
import {
  EstablishmentStatus,
  EstablishmentTimezone,
} from '@scoops/core/identity/domain/structures'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import {
  BillingPlanCode,
  SubscriptionStatus,
} from '@scoops/core/billing/domain/structures'
import { EstablishmentFaker } from '@scoops/core/identity/domain/entities/fakers'
import type { Order } from '@scoops/core/pdv/domain/entities'
import type {
  AnalyticsContextProvider,
  AnalyticsSalesFactsProvider,
} from '@scoops/core/analytics/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import type { SubscriptionsRepository } from '@scoops/core/billing/interfaces'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import type {
  RecipeIngredientsRepository,
  RecipesRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import { AccountFaker } from '@scoops/core/identity/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'
import { GetSalesAnalyticsController } from '@/analytics/rest/controllers/get-sales-analytics.controller'
import { AnalyticsModule } from '@/analytics/analytics.module'
import { ANALYTICS_PROVIDERS } from '@/analytics/constants'
import { AnalyticsProvisionModule } from '@/shared/provision/analytics/analytics-provision.module'
import { AnalyticsModuleFixture } from '@/analytics/fixtures/analytics-module-fixture'
import { BILLING_REPOSITORIES } from '@/billing/constants'
import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { IdentityBillingAnalyticsContextProvider } from '@/shared/provision/analytics/identity-billing-analytics-context-provider'
import { PdvAnalyticsSalesFactsProvider } from '@/shared/provision/analytics/pdv-analytics-sales-facts-provider'

describe('GetSalesAnalyticsController', () => {
  it('maps an authorized sales projection to the REST DTO', async () => {
    const context: AnalyticsContextProvider = {
      resolve: vi.fn().mockResolvedValue({
        establishmentId: 'establishment-1',
        establishmentIsActive: true,
        commercialAccess: 'full',
        timeZone: 'America/Sao_Paulo',
      }),
    }
    const facts: AnalyticsSalesFactsProvider = {
      forEachBatch: vi.fn(async (_input, consume) =>
        consume([
          {
            orderId: 'order-1',
            registeredAt: new Date('2026-09-13T12:00:00.000Z'),
            status: 'registered',
            canceledAt: null,
            totalCents: 1250,
            channel: { snapshotId: null, name: 'Sem canal', currentId: null },
            lines: [
              {
                productSnapshotId: 'product-1',
                productName: 'Chocolate',
                currentProductId: 'product-1',
                quantity: 1,
                allocatedNetSalesCents: 1250,
                cogsCents: 400,
              },
            ],
          },
        ]),
      ),
    }
    const datetimeProvider: DatetimeProvider = {
      now: () => new Date('2026-09-13T13:00:00.000Z'),
    }
    const controller = new GetSalesAnalyticsController(context, facts, datetimeProvider)
    const response = await controller.handle(
      { period: 'today' },
      AccountFaker.fake({
        id: 'user-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      }),
    )

    expect(response.summary.netSalesCents).toBe(1250)
    expect(response.summary.validOrders).toBe(1)
    expect(response.selected.timeZone).toBe('America/Sao_Paulo')
  })

  it('adapts the PDV snapshot into facts across paginated activity', async () => {
    const order = {
      id: 'order-1',
      establishmentId: 'establishment-1',
      channel: { channelId: 'channel-1', name: 'Delivery', percentage: 10 },
      status: 'registered',
      lines: [
        {
          product: { productId: 'product-1', name: 'Chocolate', kind: 'resale' },
          quantity: 1,
          allocatedNetSalesCents: 1000,
          cogsCents: 400,
        },
      ],
      total: 10,
      createdAt: new Date('2026-09-13T12:00:00.000Z'),
    } as unknown as Order
    const ordersRepository = {
      findActivityBatch: vi
        .fn()
        .mockResolvedValueOnce({ orders: [order], nextCursor: 'next' })
        .mockResolvedValueOnce({ orders: [], nextCursor: undefined }),
    }
    const salesChannelsRepository = {
      findMany: vi.fn().mockResolvedValue([
        { id: 'channel-1', establishmentId: 'establishment-1' },
        { id: 'foreign-channel', establishmentId: 'other-establishment' },
      ]),
    }
    const pdvDatabase = {
      readSnapshot: vi.fn((operation) =>
        operation({ ordersRepository, salesChannelsRepository }),
      ),
    }
    const mrpDatabase = {
      run: vi.fn((operation) =>
        operation({
          productsRepository: {
            findManyByIds: vi.fn().mockResolvedValue([
              {
                id: order.lines[0].product.productId,
                establishmentId: 'establishment-1',
              },
              { id: 'foreign-product', establishmentId: 'other-establishment' },
            ]),
          },
        }),
      ),
    }
    const consume = vi.fn()
    const provider = new PdvAnalyticsSalesFactsProvider(pdvDatabase, mrpDatabase)

    await provider.forEachBatch(
      {
        establishmentId: 'establishment-1',
        comparison: { startAt: new Date('2026-09-01'), endAt: new Date('2026-09-07') },
        selected: { startAt: new Date('2026-09-08'), endAt: new Date('2026-09-14') },
      },
      consume,
    )

    expect(ordersRepository.findActivityBatch).toHaveBeenCalledTimes(2)
    expect(consume).toHaveBeenCalledWith([
      expect.objectContaining({
        orderId: order.id,
        totalCents: 1000,
        channel: expect.objectContaining({ currentId: 'channel-1' }),
      }),
    ])
  })

  it('fails closed when the sales snapshot is unavailable', async () => {
    const provider = new PdvAnalyticsSalesFactsProvider(
      { run: vi.fn() },
      { run: vi.fn() },
    )

    await expect(
      provider.forEachBatch(
        {
          establishmentId: 'establishment-1',
          comparison: { startAt: new Date(), endAt: new Date() },
          selected: { startAt: new Date(), endAt: new Date() },
        },
        vi.fn(),
      ),
    ).rejects.toThrow('A fonte de vendas não está disponível.')
  })

  it('maps establishment and subscription state to commercial access', async () => {
    const establishment = EstablishmentFaker.fake({ id: 'establishment-1' })
    const establishmentsRepository = {
      findById: vi.fn().mockResolvedValue(establishment),
    }
    const subscriptionsRepository = {
      findByEstablishmentId: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 'subscription-1',
          establishmentId: establishment.id,
          planCode: BillingPlanCode.Complete,
          status: SubscriptionStatus.Blocked,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'subscription-2',
          establishmentId: establishment.id,
          planCode: BillingPlanCode.Complete,
          status: SubscriptionStatus.Deleted,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    }
    const provider = new IdentityBillingAnalyticsContextProvider(
      establishmentsRepository,
      subscriptionsRepository,
      { now: () => new Date('2026-09-13T13:00:00.000Z') },
    )

    await expect(
      provider.resolve({
        userId: 'user-1',
        establishmentId: establishment.id,
        profile: 'manager',
      }),
    ).resolves.toMatchObject({ commercialAccess: 'none' })
    await expect(
      provider.resolve({
        userId: 'user-1',
        establishmentId: establishment.id,
        profile: 'manager',
      }),
    ).resolves.toMatchObject({ commercialAccess: 'restricted' })
    await expect(
      provider.resolve({
        userId: 'user-1',
        establishmentId: establishment.id,
        profile: 'manager',
      }),
    ).resolves.toMatchObject({ commercialAccess: 'none' })
  })

  it('rejects a missing establishment context', async () => {
    const provider = new IdentityBillingAnalyticsContextProvider(
      { findById: vi.fn().mockResolvedValue(undefined) },
      { findByEstablishmentId: vi.fn() },
      { now: () => new Date() },
    )

    await expect(
      provider.resolve({
        userId: 'user-1',
        establishmentId: 'missing',
        profile: 'manager',
      }),
    ).rejects.toThrow('O estabelecimento do usuário não está disponível.')
  })

  it('registers the analytics provider bridge with the owning module tokens', () => {
    const dynamicModule = AnalyticsProvisionModule.register({
      imports: [],
      pdvDatabaseToken: 'pdv',
      mrpDatabaseToken: 'mrp',
      identityEstablishmentsToken: 'identity',
      billingSubscriptionsToken: 'billing',
      datetimeProviderToken: 'datetime',
    })

    expect(dynamicModule.providers).toHaveLength(4)
    expect(dynamicModule.exports).toEqual(Object.values(ANALYTICS_PROVIDERS))
    const providers = dynamicModule.providers as Array<{
      useFactory?: (...args: never[]) => unknown
    }>
    providers[1].useFactory?.({}, {})
    providers[2].useFactory?.({})
    expect(new AnalyticsModule()).toBeInstanceOf(AnalyticsModule)
  })

  it('normalizes unexpected sales-source failures as unavailable', async () => {
    const provider = new PdvAnalyticsSalesFactsProvider(
      { readSnapshot: vi.fn().mockRejectedValue(new Error('database offline')) },
      { run: vi.fn() },
    )

    await expect(
      provider.forEachBatch(
        {
          establishmentId: 'establishment-1',
          comparison: { startAt: new Date(), endAt: new Date() },
          selected: { startAt: new Date(), endAt: new Date() },
        },
        vi.fn(),
      ),
    ).rejects.toThrow('A fonte de vendas não está disponível.')
  })

  it('normalizes unexpected identity-source failures as unavailable', async () => {
    const provider = new IdentityBillingAnalyticsContextProvider(
      { findById: vi.fn().mockRejectedValue(new Error('database offline')) },
      { findByEstablishmentId: vi.fn() },
      { now: () => new Date() },
    )

    await expect(
      provider.resolve({
        userId: 'user-1',
        establishmentId: 'establishment-1',
        profile: 'manager',
      }),
    ).rejects.toThrow('O acesso comercial do estabelecimento não está disponível.')
  })

  it('exercises persistence adapters through the analytics module boundary', async () => {
    const fixture = await AnalyticsModuleFixture.register()
    const establishmentId = '60000000-0000-0000-0000-000000000001'

    try {
      await fixture.resetDatabase()
      const establishments = fixture.app.get<EstablishmentsRepository>(
        IDENTITY_REPOSITORIES.establishments,
      )
      await establishments.add({
        id: establishmentId,
        name: 'Analytics Fixture',
        status: EstablishmentStatus.Active,
        timeZone: EstablishmentTimezone.SaoPaulo,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      })

      const subscriptions = fixture.app.get<SubscriptionsRepository>(
        BILLING_REPOSITORIES.subscriptions,
      )
      const subscription = await subscriptions.add({
        establishmentId,
        planCode: BillingPlanCode.Complete,
        status: SubscriptionStatus.Active,
      })
      await expect(
        subscriptions.findById('60000000-0000-0000-0000-000000000002'),
      ).resolves.toBeUndefined()
      await expect(
        subscriptions.findByEstablishmentId(establishmentId),
      ).resolves.toMatchObject({
        establishmentId,
      })
      await expect(
        subscriptions.findByProviderSubscriptionId('missing'),
      ).resolves.toBeUndefined()
      await expect(subscriptions.findById(subscription.id)).resolves.toMatchObject({
        id: subscription.id,
      })
      await subscriptions.replace(establishmentId, { status: SubscriptionStatus.Blocked })
      await expect(
        subscriptions.replace('60000000-0000-0000-0000-000000000002', {}),
      ).rejects.toThrow('A assinatura não foi encontrada.')
      await expect(
        subscriptions.add({
          establishmentId,
          planCode: BillingPlanCode.Complete,
          status: SubscriptionStatus.Active,
        }),
      ).rejects.toThrow('A operação no banco de dados entrou em conflito.')

      const products = fixture.app.get<ProductsRepository>(MRP_REPOSITORIES.products)
      const product = await products.add({
        establishmentId,
        name: 'Morango',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        status: ProductStatus.Active,
        idealStock: 5,
      })
      const ingredient = await products.add({
        establishmentId,
        name: 'Leite',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        status: ProductStatus.Active,
      })
      const recipes = fixture.app.get<RecipesRepository>(MRP_REPOSITORIES.recipes)
      const recipe = await recipes.add({
        establishmentId,
        productId: product.id,
        yieldQuantity: 4,
      })
      const recipeIngredients = fixture.app.get<RecipeIngredientsRepository>(
        MRP_REPOSITORIES.recipeIngredients,
      )
      await recipeIngredients.add({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
        quantity: 2,
      })
      const balances = fixture.app.get<StockBalancesRepository>(
        MRP_REPOSITORIES.stockBalances,
      )
      await balances.initialize(product.id)
      await balances.initialize(ingredient.id)
      await balances.add({ productId: product.id }, 2)
      await balances.add({ productId: ingredient.id }, 8)
      const stockFacts = fixture.app.get(ANALYTICS_PROVIDERS.stockFacts)
      await expect(stockFacts.list(establishmentId)).resolves.toHaveLength(1)
      await subscriptions.removeAll()
    } finally {
      await fixture.close()
    }
  })
})
