import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { OrderCreate, SalesChannelCreate } from '@scoops/core/pdv/domain/entities'
import type { ComboCreate } from '@scoops/core/pdv/domain/structures'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductCreate } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PdvGlobalSearchProvider } from '@scoops/core/identity/interfaces'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'

const establishmentId = '81000000-0000-0000-0000-000000000001'
const foreignEstablishmentId = '82000000-0000-0000-0000-000000000001'
const managerId = '81000000-0000-0000-0000-000000000002'
const operatorId = '81000000-0000-0000-0000-000000000003'
const colleagueId = '81000000-0000-0000-0000-000000000004'
const foreignManagerId = '82000000-0000-0000-0000-000000000002'
const managerToken = 'global-search-manager-token'
const operatorToken = 'global-search-operator-token'
const foreignManagerToken = 'global-search-foreign-manager-token'

function createOrderSeed(input: {
  establishmentId: string
  createdBy: string
  createdByName: string
  productId: string
  productName: string
}): OrderCreate & { createdAt: Date } {
  return {
    establishmentId: input.establishmentId,
    idempotencyKey: crypto.randomUUID(),
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    lines: [
      {
        product: {
          productId: input.productId,
          name: input.productName,
          kind: 'resale',
        },
        accompaniments: [],
        quantity: 1,
        baseUnitPrice: 10,
        finalUnitPrice: 10,
        subtotal: 10,
        allocatedNetSalesCents: 1000,
        costComponents: [],
        cogsCents: null,
        consumptions: [{ productId: input.productId, quantity: 1 }],
      },
    ],
    discounts: [],
    subtotal: 10,
    totalDiscount: 0,
    total: 10,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  }
}

describe('Search Global Controller [GET /global-search]', () => {
  const auth = new BetterAuthFixture()
  let fixture: IdentityModuleFixture
  let productId: string
  let orderId: string

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(auth)
  })

  beforeEach(async () => {
    await auth.clear()
    await fixture.resetDatabase()

    await fixture.get<IdentitySeeder>(IdentitySeeder).run({
      establishments: [
        EstablishmentFaker.fake({ id: establishmentId }),
        EstablishmentFaker.fake({ id: foreignEstablishmentId }),
      ],
      users: [
        UserFaker.fake({
          id: managerId,
          establishmentId,
          name: 'Matching Manager',
          email: 'search.manager@example.com',
          profile: UserProfile.Manager,
        }),
        UserFaker.fake({
          id: operatorId,
          establishmentId,
          name: 'Search Operator',
          email: 'search.operator@example.com',
          profile: UserProfile.Operator,
        }),
        UserFaker.fake({
          id: colleagueId,
          establishmentId,
          name: 'Matching Colleague',
          email: 'matching.colleague@example.com',
          profile: UserProfile.Operator,
        }),
        UserFaker.fake({
          id: foreignManagerId,
          establishmentId: foreignEstablishmentId,
          name: 'Matching Foreign Manager',
          email: 'matching.foreign@example.com',
          profile: UserProfile.Manager,
        }),
      ],
      registrationAttempts: [],
    })

    const matchingProduct = ProductFaker.fake({
      establishmentId,
      name: 'Matching Product',
    })
    const foreignProduct = ProductFaker.fake({
      establishmentId: foreignEstablishmentId,
      name: 'Matching Foreign Product',
    })
    const toProductCreate = ({
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...input
    }: ReturnType<typeof ProductFaker.fake>): ProductCreate => input
    const productsRepository = fixture.get<
      import('@scoops/core/mrp/interfaces').ProductsRepository
    >(MRP_REPOSITORIES.products)
    await fixture
      .get<MrpSeeder>(MrpSeeder)
      .run([toProductCreate(matchingProduct), toProductCreate(foreignProduct)])
    const productPage = await productsRepository.findMany({
      establishmentId,
      search: 'Matching Product',
      page: 1,
      pageSize: 1,
    })
    productId = productPage.items[0]?.product.id ?? ''
    expect(productId).not.toBe('')

    const historicalProduct = await productsRepository.add(
      toProductCreate(ProductFaker.fake({ establishmentId, name: 'Renamed Vanilla' })),
    )

    const order = createOrderSeed({
      establishmentId,
      createdBy: managerId,
      createdByName: 'Matching Manager',
      productId: historicalProduct.id,
      productName: 'Historic Vanilla Snapshot',
    })
    const foreignOrder = createOrderSeed({
      establishmentId: foreignEstablishmentId,
      createdBy: foreignManagerId,
      createdByName: 'Matching Foreign Manager',
      productId: foreignProduct.id,
      productName: 'Matching Foreign Flavor',
    })

    await fixture.get<PdvSeeder>(PdvSeeder).run({
      salesChannels: [
        { establishmentId, name: 'Matching Delivery', percentage: 10, status: 'active' },
        {
          establishmentId: foreignEstablishmentId,
          name: 'Matching Foreign Delivery',
          percentage: 10,
          status: 'active',
        },
      ],
      combos: [
        {
          establishmentId,
          name: 'Matching Discount',
          status: 'active',
          fixedPrice: 30,
          components: [{ kind: 'resale', productId: historicalProduct.id, quantity: 1 }],
        } satisfies ComboCreate,
      ],
      orders: [order, foreignOrder],
    })
    const storedOrderPage = await fixture
      .get<import('@scoops/core/pdv/interfaces').OrdersRepository>(
        PDV_REPOSITORIES.orders,
      )
      .findMany({ establishmentId, search: 'Historic', page: 1, pageSize: 1 })
    orderId = storedOrderPage.items[0]?.id ?? ''
    expect(orderId).not.toBe('')

    auth.setUser(managerToken, { id: managerId, email: 'search.manager@example.com' })
    auth.setUser(operatorToken, { id: operatorId, email: 'search.operator@example.com' })
    auth.setUser(foreignManagerToken, {
      id: foreignManagerId,
      email: 'matching.foreign@example.com',
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns authorized, tenant-scoped groups for a Manager', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/global-search?q=matching')
      .set('Cookie', `scoops.session_token=${managerToken}`)

    expect(response.status).toBe(200)
    expect(Object.keys(response.body).sort()).toEqual(
      ['pages', 'products', 'orders', 'users', 'salesChannels', 'discounts'].sort(),
    )
    expect(response.body).toMatchObject({
      products: [{ kind: 'product', productId, label: 'Matching Product' }],
      users: [{ kind: 'user', userId: colleagueId, label: 'Matching Colleague' }],
      salesChannels: [{ kind: 'salesChannel', label: 'Matching Delivery' }],
      discounts: [{ kind: 'discount', label: 'Matching Discount' }],
    })
    expect(JSON.stringify(response.body)).not.toContain('Matching Foreign')
    expect(
      response.body.users.some((user: { userId: string }) => user.userId === managerId),
    ).toBe(false)
  })

  it('limits Operator results to scoped orders and matches sequence numbers with or without #', async () => {
    const operatorCookie = `scoops.session_token=${operatorToken}`
    const textualResult = await request(fixture.app.getHttpServer())
      .get('/global-search?q=Historic')
      .set('Cookie', operatorCookie)
    const plainNumber = await request(fixture.app.getHttpServer())
      .get('/global-search?q=1')
      .set('Cookie', operatorCookie)
    const prefixedNumber = await request(fixture.app.getHttpServer())
      .get('/global-search?q=%231')
      .set('Cookie', operatorCookie)

    expect(textualResult.status).toBe(200)
    expect(textualResult.body).toMatchObject({
      orders: [
        {
          kind: 'order',
          orderId,
          label: '#1',
          context: 'Historic Vanilla Snapshot',
        },
      ],
      products: [],
      users: [],
      salesChannels: [],
      discounts: [],
    })
    expect(plainNumber.body.orders).toHaveLength(1)
    expect(prefixedNumber.body.orders).toEqual(plainNumber.body.orders)
    expect(plainNumber.body.orders[0]?.orderId).toBe(orderId)
  })

  it('returns establishment-scoped Operator records without Identity user results', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/global-search?q=matching')
      .set('Cookie', `scoops.session_token=${operatorToken}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      products: [{ kind: 'product', productId, label: 'Matching Product' }],
      orders: [],
      users: [],
      salesChannels: [{ kind: 'salesChannel', label: 'Matching Delivery' }],
      discounts: [{ kind: 'discount', label: 'Matching Discount' }],
    })
    expect(JSON.stringify(response.body)).not.toContain('Matching Foreign')
    expect(JSON.stringify(response.body)).not.toContain('Matching Colleague')
  })

  it('treats SQL LIKE metacharacters literally across Operator record providers', async () => {
    const productsRepository = fixture.get<
      import('@scoops/core/mrp/interfaces').ProductsRepository
    >(MRP_REPOSITORIES.products)
    const matchingProducts: Record<string, { id: string; name: string }> = {}
    const matchingOrders: Record<string, string> = {}
    const matchingChannels: Record<string, string> = {}
    const matchingDiscounts: Record<string, string> = {}
    const salesChannels: SalesChannelCreate[] = []
    const combos: ComboCreate[] = []
    const orders: (OrderCreate & { createdAt: Date })[] = []

    for (const { character, label } of [
      { character: '%', label: 'Percent' },
      { character: '_', label: 'Underscore' },
      { character: '\\', label: 'Backslash' },
    ]) {
      const productName = `Literal ${label}${character} Product`
      const decoyProductName = `Literal ${label}X Product`
      const matchingProduct = await productsRepository.add(
        toProductCreate(ProductFaker.fake({ establishmentId, name: productName })),
      )
      const decoyProduct = await productsRepository.add(
        toProductCreate(ProductFaker.fake({ establishmentId, name: decoyProductName })),
      )

      const orderSnapshot = `Literal ${label}${character} Order`
      const decoyOrderSnapshot = `Literal ${label}X Order`
      orders.push(
        createOrderSeed({
          establishmentId,
          createdBy: managerId,
          createdByName: 'Matching Manager',
          productId: matchingProduct.id,
          productName: orderSnapshot,
        }),
        createOrderSeed({
          establishmentId,
          createdBy: managerId,
          createdByName: 'Matching Manager',
          productId: decoyProduct.id,
          productName: decoyOrderSnapshot,
        }),
      )

      const channelName = `Literal ${label}${character} Channel`
      const decoyChannelName = `Literal ${label}X Channel`
      salesChannels.push(
        { establishmentId, name: channelName, percentage: 10, status: 'active' },
        { establishmentId, name: decoyChannelName, percentage: 10, status: 'active' },
      )

      const discountName = `Literal ${label}${character} Discount`
      const decoyDiscountName = `Literal ${label}X Discount`
      combos.push(
        {
          establishmentId,
          name: discountName,
          status: 'active',
          fixedPrice: 10,
          components: [{ kind: 'resale', productId: matchingProduct.id, quantity: 1 }],
        },
        {
          establishmentId,
          name: decoyDiscountName,
          status: 'active',
          fixedPrice: 10,
          components: [{ kind: 'resale', productId: decoyProduct.id, quantity: 1 }],
        },
      )

      matchingProducts[character] = { id: matchingProduct.id, name: productName }
      matchingOrders[character] = orderSnapshot
      matchingChannels[character] = channelName
      matchingDiscounts[character] = discountName
    }

    await fixture.get<PdvSeeder>(PdvSeeder).run({ salesChannels, combos, orders })

    for (const character of ['%', '_', '\\']) {
      const response = await request(fixture.app.getHttpServer())
        .get(`/global-search?q=${encodeURIComponent(character)}`)
        .set('Cookie', `scoops.session_token=${operatorToken}`)

      expect(response.status).toBe(200)
      expect(response.body.products).toEqual([
        expect.objectContaining({
          productId: matchingProducts[character]?.id,
          label: matchingProducts[character]?.name,
        }),
      ])
      expect(response.body.orders).toEqual([
        expect.objectContaining({ context: matchingOrders[character] }),
      ])
      expect(response.body.salesChannels).toEqual([
        expect.objectContaining({ label: matchingChannels[character] }),
      ])
      expect(response.body.discounts).toEqual([
        expect.objectContaining({ label: matchingDiscounts[character] }),
      ])
      expect(response.body.users).toEqual([])
    }
  })

  it('fails the complete response when any record provider rejects', async () => {
    const provider = fixture.get<PdvGlobalSearchProvider>(
      IDENTITY_PROVIDERS.globalSearchPdv,
    )
    // A provider outage cannot be induced through a practical database fixture; fail this adapter locally to verify HTTP atomicity.
    const searchSalesChannels = vi
      .spyOn(provider, 'searchSalesChannels')
      .mockRejectedValue(new Error('Simulated sales-channel provider failure.'))

    try {
      const response = await request(fixture.app.getHttpServer())
        .get('/global-search?q=matching')
        .set('Cookie', `scoops.session_token=${managerToken}`)

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        statusCode: 500,
        path: '/global-search?q=matching',
      })
      expect(response.body.message).not.toContain(
        'Simulated sales-channel provider failure.',
      )
      expect(JSON.stringify(response.body)).not.toContain('Matching Product')
      expect(response.body.products).toBeUndefined()
    } finally {
      searchSalesChannels.mockRestore()
    }
  })

  it('requires authentication and rejects invalid query lengths', async () => {
    const unauthorized = await request(fixture.app.getHttpServer()).get(
      '/global-search?q=abc',
    )
    const blank = await request(fixture.app.getHttpServer())
      .get('/global-search?q=%20%20')
      .set('Cookie', `scoops.session_token=${managerToken}`)
    const tooLong = await request(fixture.app.getHttpServer())
      .get(`/global-search?q=${'a'.repeat(101)}`)
      .set('Cookie', `scoops.session_token=${managerToken}`)

    expect(unauthorized.status).toBe(401)
    expect(blank.status).toBe(422)
    expect(tooLong.status).toBe(422)
  })
})

function toProductCreate({
  id: _id,
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  ...input
}: ReturnType<typeof ProductFaker.fake>): ProductCreate {
  return input
}
