import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import type { GlobalAccompaniment } from '@scoops/core/mrp/domain/entities'
import request from 'supertest'
import {
  ProductCreatedEvent,
  ProductStockAlertStateEnteredEvent,
} from '@scoops/core/mrp/domain/events'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  countRows,
  failInsertInto,
  foreignManagerRequestAuthorization,
  findEvents,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Register Product Controller [POST /products]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('registers a Single product with its initial balance and transaction', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: '  Leite integral  ',
        unit: 'l',
        categories: ['ingredient'],
        stockControl: 'single',
        allowNegativeStock: false,
        idealStock: 10,
        currentUnitCost: 2.5,
        initialStock: 5,
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      establishmentId: MrpModuleFixture.accounts.establishmentId,
      name: 'Leite integral',
      stockControl: 'single',
      currentUnitCost: 2.5,
    })

    const product = await fixture.products.findByName(
      MrpModuleFixture.accounts.establishmentId,
      'Leite integral',
    )
    if (!product) throw new Error('The registered product was not persisted.')
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 5,
    })
    const page = await fixture.transactions.findPage(
      MrpModuleFixture.accounts.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toMatchObject({
      productName: 'Leite integral',
      type: 'entry',
      quantity: 5,
      balanceAfter: 5,
      performedByName: 'Maria Manager',
    })
    const events = await findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME)
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            productId: product.id,
            state: 'below-ideal',
            availableQuantity: 5,
            idealQuantity: 10,
          }),
        }),
      ]),
    )
  })

  it('registers all By-brand balances and persists the selected non-first primary brand', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Cobertura de chocolate',
        unit: 'kg',
        categories: ['ingredient'],
        stockControl: 'by-brand',
        idealStock: 10,
        initialStock: 5,
        brands: [
          {
            name: 'Callebaut',
            packageQuantity: 2,
            packageValue: 30,
            initialQuantity: 2,
            isPrimary: false,
          },
          {
            name: 'Sicao',
            packageQuantity: 1,
            packageValue: 18,
            initialQuantity: 3,
            isPrimary: true,
          },
        ],
      })

    expect(response.status).toBe(201)
    const product = await fixture.products.findByName(
      MrpModuleFixture.accounts.establishmentId,
      'Cobertura de chocolate',
    )
    if (!product) throw new Error('The registered product was not persisted.')

    const brands = await fixture.brands.findManyByProductId(product.id)
    expect(brands).toHaveLength(2)
    expect(brands.filter((brand) => brand.isPrimary)).toHaveLength(1)
    expect(brands.find((brand) => brand.name === 'Sicao')).toMatchObject({
      isPrimary: true,
    })
    expect(brands.find((brand) => brand.name === 'Callebaut')).toMatchObject({
      isPrimary: false,
    })

    const balances = await fixture.balances.findManyByProductId(product.id)
    expect(balances).toHaveLength(2)
    expect(
      balances
        .map(({ brandId, quantity }) => ({ brandId, quantity }))
        .sort((a, b) => (a.brandId ?? '').localeCompare(b.brandId ?? '')),
    ).toEqual(
      brands
        .map((brand) => ({ brandId: brand.id, quantity: brand.name === 'Sicao' ? 3 : 2 }))
        .sort((a, b) => a.brandId.localeCompare(b.brandId)),
    )

    const page = await fixture.transactions.findPage(
      MrpModuleFixture.accounts.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items).toHaveLength(2)
    expect(page.items.map((item) => item.brandName).sort()).toEqual([
      'Callebaut',
      'Sicao',
    ])
    const events = await findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME)
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            productId: product.id,
            state: 'below-ideal',
            availableQuantity: 5,
            idealQuantity: 10,
          }),
        }),
      ]),
    )
  })

  it('rejects a new Portion Accompaniment combination and allows Accompaniment Resale', async () => {
    const rejected = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Invalid Portion Accompaniment',
        unit: 'un',
        categories: ['portion', 'accompaniment'],
        stockControl: 'single',
        idealStock: 0,
      })
    expect(rejected.status).toBe(400)
    await expect(
      fixture.products.findByName(
        MrpModuleFixture.accounts.establishmentId,
        'Invalid Portion Accompaniment',
      ),
    ).resolves.toBeUndefined()

    const allowed = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Resale Accompaniment',
        unit: 'un',
        categories: ['accompaniment', 'resale'],
        stockControl: 'single',
        idealStock: 0,
      })
    expect(allowed.status).toBe(201)
    expect(allowed.body.categories).toEqual(['accompaniment', 'resale'])
  })

  it('rejects invalid primary cardinality before creating any product data', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Invalid brand selection',
        unit: 'kg',
        categories: ['ingredient'],
        stockControl: 'by-brand',
        idealStock: 0,
        brands: [
          {
            name: 'Callebaut',
            packageQuantity: 2,
            packageValue: 30,
            initialQuantity: 0,
            isPrimary: false,
          },
          {
            name: 'Sicao',
            packageQuantity: 1,
            packageValue: 18,
            initialQuantity: 0,
            isPrimary: false,
          },
        ],
      })

    expect(response.status).toBe(422)
    await expect(
      fixture.products.findByName(
        MrpModuleFixture.accounts.establishmentId,
        'Invalid brand selection',
      ),
    ).resolves.toBeUndefined()
  })

  it('enforces authentication and Manager authorization without persistence', async () => {
    const body = {
      name: 'Protected product',
      unit: 'kg',
      categories: ['ingredient'],
      stockControl: 'single',
      idealStock: 0,
    }
    const anonymous = await request(fixture.app.getHttpServer())
      .post('/products')
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', operatorRequestAuthorization())
      .send(body)

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    await expect(
      fixture.products.findByName(
        MrpModuleFixture.accounts.establishmentId,
        'Protected product',
      ),
    ).resolves.toBeUndefined()
  })

  it('scopes duplicate names to the authenticated establishment', async () => {
    const body = {
      name: 'Tenant-scoped product',
      unit: 'kg',
      categories: ['ingredient'],
      stockControl: 'single',
      idealStock: 0,
    }
    const manager = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const duplicate = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .post('/products')
      .set('Cookie', foreignManagerRequestAuthorization())
      .send(body)

    expect(manager.status).toBe(201)
    expect(duplicate.status).toBe(409)
    expect(foreign.status).toBe(201)
    expect(foreign.body).toMatchObject({
      name: body.name,
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
    })
    expect(foreign.body.id).not.toBe(manager.body.id)
  })
  describe('sale prices', () => {
    const establishmentId = MrpModuleFixture.accounts.establishmentId
    const byBrandStock = {
      stockControl: 'by-brand',
      brands: [
        {
          name: 'House',
          packageQuantity: 1,
          packageValue: 5,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    }

    function registerProduct(
      body: Record<string, unknown>,
      authorization: string | null = managerRequestAuthorization(),
    ) {
      const call = request(fixture.app.getHttpServer())
        .post('/products')
        .send({ unit: 'un', stockControl: 'single', idealStock: 0, ...body })
      return authorization ? call.set('Cookie', authorization) : call
    }

    function readPricing(
      productId: string,
      authorization = managerRequestAuthorization(),
    ) {
      return request(fixture.app.getHttpServer())
        .get(`/products/${productId}/pricing`)
        .set('Cookie', authorization)
    }

    it('registers a Single Resale product with an available configuration at the typed price', async () => {
      const response = await registerProduct({
        name: 'Paçoca',
        categories: ['resale'],
        initialStock: 10,
        resalePrice: 12.5,
      })

      expect(response.status).toBe(201)
      expect(response.body).not.toHaveProperty('accompanimentPrice')
      const configurations = await fixture.resaleConfigurations.findManyByProductId(
        establishmentId,
        response.body.id,
      )
      expect(configurations).toHaveLength(1)
      expect(configurations[0]).toMatchObject({
        establishmentId,
        productId: response.body.id,
        price: 12.5,
        isActive: true,
      })
      expect(configurations[0]?.brandId).toBeFalsy()
      const pricing = await readPricing(response.body.id)
      expect(pricing.status).toBe(200)
      expect(pricing.body.resale).toHaveLength(1)
      expect(pricing.body.resale[0]).toMatchObject({
        price: 12.5,
        isActive: true,
        packageQuantity: 1,
      })
    })

    it.each([0, 2.9])(
      'saves the product-owned Accompaniment price %s without a Resale configuration',
      async (accompanimentPrice) => {
        const response = await registerProduct({
          name: 'Granola',
          categories: ['accompaniment'],
          accompanimentPrice,
        })

        expect(response.status).toBe(201)
        expect(response.body.accompanimentPrice).toBe(accompanimentPrice)
        await expect(
          fixture.products.findById(establishmentId, response.body.id),
        ).resolves.toMatchObject({ accompanimentPrice })
        await expect(
          fixture.resaleConfigurations.findManyByProductId(
            establishmentId,
            response.body.id,
          ),
        ).resolves.toEqual([])
      },
    )

    it('keeps both prices independent, including after a later Resale price change', async () => {
      const response = await registerProduct({
        name: 'Brigadeiro',
        categories: ['resale', 'accompaniment'],
        initialStock: 4,
        resalePrice: 12,
        accompanimentPrice: 9,
      })
      expect(response.status).toBe(201)

      const resaleSave = await request(fixture.app.getHttpServer())
        .put(`/products/${response.body.id}/resale-configuration`)
        .set('Cookie', managerRequestAuthorization())
        .send({ price: 15, isActive: true })

      expect(resaleSave.status).toBe(200)
      await expect(
        fixture.products.findById(establishmentId, response.body.id),
      ).resolves.toMatchObject({ accompanimentPrice: 9 })
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          establishmentId,
          response.body.id,
        ),
      ).resolves.toEqual([expect.objectContaining({ price: 15, isActive: true })])
    })

    it('saves only the price it receives for a Resale and Accompaniment product', async () => {
      const response = await registerProduct({
        name: 'Doce de leite',
        categories: ['resale', 'accompaniment'],
        resalePrice: 12,
      })

      expect(response.status).toBe(201)
      expect(response.body).not.toHaveProperty('accompanimentPrice')
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          establishmentId,
          response.body.id,
        ),
      ).resolves.toEqual([expect.objectContaining({ price: 12 })])
    })

    it('saves nothing and leaves the product unpriced when no price is sent', async () => {
      const response = await registerProduct({
        name: 'Sem preço',
        categories: ['resale', 'accompaniment'],
      })

      expect(response.status).toBe(201)
      expect(response.body).not.toHaveProperty('accompanimentPrice')
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          establishmentId,
          response.body.id,
        ),
      ).resolves.toEqual([])
      const pricing = await readPricing(response.body.id)
      expect(pricing.body.resale[0]).toMatchObject({ isActive: false })
      expect(pricing.body.resale[0]).not.toHaveProperty('configuration')
    })

    it('registers a By-brand Resale product without a price as before', async () => {
      const response = await registerProduct({
        name: 'Refrigerante',
        categories: ['resale'],
        ...byBrandStock,
      })

      expect(response.status).toBe(201)
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          establishmentId,
          response.body.id,
        ),
      ).resolves.toEqual([])
    })

    it.each([
      ['a negative Resale price', { categories: ['resale'], resalePrice: -1 }],
      ['a three-decimal Resale price', { categories: ['resale'], resalePrice: 1.234 }],
      [
        'a Resale price at the numeric limit',
        { categories: ['resale'], resalePrice: 10_000_000_000_000_000 },
      ],
      ['a non-numeric Resale price', { categories: ['resale'], resalePrice: 'abc' }],
      [
        'a negative Accompaniment price',
        { categories: ['accompaniment'], accompanimentPrice: -1 },
      ],
      [
        'a three-decimal Accompaniment price',
        { categories: ['accompaniment'], accompanimentPrice: 1.234 },
      ],
      [
        'an Accompaniment price at the numeric limit',
        { categories: ['accompaniment'], accompanimentPrice: 10_000_000_000_000_000 },
      ],
      [
        'a non-numeric Accompaniment price',
        { categories: ['accompaniment'], accompanimentPrice: 'abc' },
      ],
    ])('rejects %s as malformed without persisting anything', async (_name, body) => {
      const response = await registerProduct({ name: 'Rejected price', ...body })

      expect(response.status).toBe(422)
      await expectNothingRegistered('Rejected price')
    })

    it.each([
      ['a Resale price on an Ingredient', { categories: ['ingredient'], resalePrice: 1 }],
      ['a Resale price on a Portion', { categories: ['portion'], resalePrice: 1 }],
      [
        'a Resale price on an Accompaniment-only product',
        { categories: ['accompaniment'], resalePrice: 1 },
      ],
      [
        'a Resale price on a By-brand Resale product',
        { categories: ['resale'], ...byBrandStock, resalePrice: 1 },
      ],
      [
        'an Accompaniment price on an Ingredient',
        { categories: ['ingredient'], accompanimentPrice: 1 },
      ],
      [
        'an Accompaniment price on a Portion',
        { categories: ['portion'], accompanimentPrice: 1 },
      ],
      [
        'an Accompaniment price on a Resale-only product',
        { categories: ['resale'], accompanimentPrice: 1 },
      ],
      [
        'an Accompaniment price on a By-brand Accompaniment product',
        { categories: ['accompaniment'], ...byBrandStock, accompanimentPrice: 1 },
      ],
    ])('rejects %s without persisting anything', async (_name, body) => {
      const response = await registerProduct({ name: 'Rejected price', ...body })

      expect(response.status).toBe(400)
      await expectNothingRegistered('Rejected price')
    })

    it('refuses a priced registration from anonymous users and Operators', async () => {
      const body = { name: 'Protected priced', categories: ['resale'], resalePrice: 5 }

      const anonymous = await registerProduct(body, null)
      const operator = await registerProduct(body, operatorRequestAuthorization())

      expect(anonymous.status).toBe(401)
      expect(operator.status).toBe(403)
      await expectNothingRegistered('Protected priced')
    })

    it('stores the prices only under the registering establishment', async () => {
      const body = {
        name: 'Tenant priced',
        categories: ['resale', 'accompaniment'],
        resalePrice: 12.5,
        accompanimentPrice: 3,
      }
      const manager = await registerProduct(body)
      const foreignRead = await readPricing(
        manager.body.id,
        foreignManagerRequestAuthorization(),
      )
      const foreign = await registerProduct(
        { ...body, resalePrice: 20, accompanimentPrice: 4 },
        foreignManagerRequestAuthorization(),
      )

      expect(manager.status).toBe(201)
      expect(foreignRead.status).toBe(404)
      expect(foreign.status).toBe(201)
      const foreignEstablishmentId = MrpModuleFixture.accounts.foreignEstablishmentId
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          foreignEstablishmentId,
          foreign.body.id,
        ),
      ).resolves.toEqual([
        expect.objectContaining({
          establishmentId: foreignEstablishmentId,
          price: 20,
        }),
      ])
      await expect(
        fixture.resaleConfigurations.findManyByProductId(
          establishmentId,
          manager.body.id,
        ),
      ).resolves.toEqual([expect.objectContaining({ price: 12.5 })])
      await expect(
        fixture.products.findById(establishmentId, manager.body.id),
      ).resolves.toMatchObject({ accompanimentPrice: 3 })
    })

    it('rolls the whole registration back when the Resale configuration cannot be saved', async () => {
      const removeFailure = await failInsertInto(fixture, 'resale_configurations')

      let response: request.Response
      try {
        response = await registerProduct({
          name: 'Atomic priced',
          categories: ['resale', 'accompaniment'],
          initialStock: 10,
          resalePrice: 12.5,
          accompanimentPrice: 3,
        })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expectNothingRegistered('Atomic priced')
      await expect(
        findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME),
      ).resolves.toEqual([])
    })

    it('rolls resale configuration, balance and product back when a later write fails', async () => {
      const removeFailure = await failInsertInto(fixture, 'stock_transactions')

      let response: request.Response
      try {
        response = await registerProduct({
          name: 'Atomic late failure',
          categories: ['resale'],
          initialStock: 10,
          resalePrice: 12.5,
        })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expectNothingRegistered('Atomic late failure')
      await expect(countRows(fixture, 'resale_configurations')).resolves.toBe(0)
      await expect(countRows(fixture, 'stock_balances')).resolves.toBe(0)
      await expect(countRows(fixture, 'stock_transactions')).resolves.toBe(0)
      await expect(
        findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME),
      ).resolves.toEqual([])
    })

    async function expectNothingRegistered(name: string) {
      await expect(
        fixture.products.findByName(establishmentId, name),
      ).resolves.toBeUndefined()
      await expect(findEvents(fixture, ProductCreatedEvent._NAME)).resolves.toEqual([])
    }
  })

  describe('sizes', () => {
    const establishmentId = MrpModuleFixture.accounts.establishmentId
    const byBrandStock = {
      stockControl: 'by-brand',
      brands: [
        {
          name: 'House',
          packageQuantity: 1,
          packageValue: 5,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    }
    const sizes = [
      { name: ' Pequeno ', quantity: 0.3, price: 9.9 },
      { name: 'Grande', quantity: 0.5, price: 14.5 },
    ]

    function registerProduct(
      body: Record<string, unknown>,
      authorization: string | null = managerRequestAuthorization(),
    ) {
      const call = request(fixture.app.getHttpServer())
        .post('/products')
        .send({ unit: 'kg', stockControl: 'single', idealStock: 0, ...body })
      return authorization ? call.set('Cookie', authorization) : call
    }

    function readPricing(
      productId: string,
      authorization = managerRequestAuthorization(),
    ) {
      return request(fixture.app.getHttpServer())
        .get(`/products/${productId}/pricing`)
        .set('Cookie', authorization)
    }

    it.each([
      ['Single', {}],
      ['By-brand', byBrandStock],
    ])(
      'registers a %s Portion together with one active size per row',
      async (_name, stock) => {
        const response = await registerProduct({
          name: 'Açaí',
          categories: ['portion'],
          initialStock: 0,
          ...stock,
          sizes,
        })

        expect(response.status).toBe(201)
        const stored = await fixture.productSizes.findManyByProductId(
          establishmentId,
          response.body.id,
        )
        expect(
          stored.map(({ name, quantity, price, isActive }) => ({
            name,
            quantity,
            price,
            isActive,
          })),
        ).toEqual(
          expect.arrayContaining([
            { name: 'Pequeno', quantity: 0.3, price: 9.9, isActive: true },
            { name: 'Grande', quantity: 0.5, price: 14.5, isActive: true },
          ]),
        )
        expect(stored).toHaveLength(2)
        expect(stored.every((size) => size.establishmentId === establishmentId)).toBe(
          true,
        )
        const pricing = await readPricing(response.body.id)
        expect(pricing.status).toBe(200)
        expect(pricing.body.sizes).toHaveLength(2)
      },
    )

    it.each([
      ['no sizes key', {}],
      ['an empty sizes list', { sizes: [] }],
    ])('creates no size for a Portion registered with %s', async (_name, body) => {
      const response = await registerProduct({
        name: 'Açaí sem tamanhos',
        categories: ['portion'],
        ...body,
      })

      expect(response.status).toBe(201)
      await expect(countRows(fixture, 'product_sizes')).resolves.toBe(0)
    })

    it.each([
      ['a non-Portion product', { categories: ['ingredient'] }, 400],
      ['a Resale product', { categories: ['resale'] }, 400],
      [
        'duplicate names after trimming and lower-casing',
        {
          categories: ['portion'],
          sizes: [
            { name: 'Médio', quantity: 1, price: 5 },
            { name: ' MÉDIO ', quantity: 2, price: 8 },
          ],
        },
        400,
      ],
      [
        'an empty name',
        { categories: ['portion'], sizes: [{ name: '', quantity: 1, price: 5 }] },
        422,
      ],
      [
        'a name over 120 characters',
        {
          categories: ['portion'],
          sizes: [{ name: 'a'.repeat(121), quantity: 1, price: 5 }],
        },
        422,
      ],
      [
        'a zero quantity',
        { categories: ['portion'], sizes: [{ name: 'A', quantity: 0, price: 5 }] },
        422,
      ],
      [
        'a quantity with four decimals',
        { categories: ['portion'], sizes: [{ name: 'A', quantity: 1.2345, price: 5 }] },
        422,
      ],
      [
        'a quantity at the numeric limit',
        {
          categories: ['portion'],
          sizes: [{ name: 'A', quantity: 1_000_000_000_000_000, price: 5 }],
        },
        422,
      ],
      [
        'a negative price',
        { categories: ['portion'], sizes: [{ name: 'A', quantity: 1, price: -1 }] },
        422,
      ],
      [
        'a price with three decimals',
        { categories: ['portion'], sizes: [{ name: 'A', quantity: 1, price: 1.005 }] },
        422,
      ],
      [
        'a price at the numeric limit',
        {
          categories: ['portion'],
          sizes: [{ name: 'A', quantity: 1, price: 10_000_000_000_000_000 }],
        },
        422,
      ],
      [
        'an unknown size key',
        {
          categories: ['portion'],
          sizes: [{ name: 'A', quantity: 1, price: 5, isActive: false }],
        },
        422,
      ],
    ])('rejects %s without persisting anything', async (_name, body, status) => {
      const rejected =
        'sizes' in body
          ? body
          : { ...body, sizes: [{ name: 'A', quantity: 1, price: 5 }] }
      const response = await registerProduct({ name: 'Rejected sizes', ...rejected })

      expect(response.status).toBe(status)
      await expectNothingRegistered('Rejected sizes')
    })

    it('refuses a registration with sizes from anonymous users and Operators', async () => {
      const body = { name: 'Protected sizes', categories: ['portion'], sizes }

      const anonymous = await registerProduct(body, null)
      const operator = await registerProduct(body, operatorRequestAuthorization())

      expect(anonymous.status).toBe(401)
      expect(operator.status).toBe(403)
      await expectNothingRegistered('Protected sizes')
    })

    it('stores the sizes only under the registering establishment', async () => {
      const body = { name: 'Tenant sizes', categories: ['portion'], sizes }
      const manager = await registerProduct(body)
      const foreignRead = await readPricing(
        manager.body.id,
        foreignManagerRequestAuthorization(),
      )
      const foreign = await registerProduct(body, foreignManagerRequestAuthorization())

      expect(manager.status).toBe(201)
      expect(foreignRead.status).toBe(404)
      expect(foreign.status).toBe(201)
      const foreignEstablishmentId = MrpModuleFixture.accounts.foreignEstablishmentId
      const foreignSizes = await fixture.productSizes.findManyByProductId(
        foreignEstablishmentId,
        foreign.body.id,
      )
      expect(foreignSizes).toHaveLength(2)
      expect(
        foreignSizes.every((size) => size.establishmentId === foreignEstablishmentId),
      ).toBe(true)
      await expect(
        fixture.productSizes.findManyByProductId(establishmentId, manager.body.id),
      ).resolves.toHaveLength(2)
    })

    it('rolls the whole registration back when the second size cannot be saved', async () => {
      const type = await fixture.addAccompanimentType({
        establishmentId,
        name: 'Atomic Type',
      })
      const target = await fixture.addProduct(
        createProduct({
          name: 'Atomic Granola',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 3,
        }),
      )
      await addGlobalAccompanimentWithRows(fixture, { target, type, portions: [] })
      const removeFailure = await failInsertInto(fixture, 'product_sizes', 1)

      let response: request.Response
      try {
        response = await registerProduct({
          name: 'Atomic sizes',
          categories: ['portion'],
          initialStock: 10,
          sizes,
        })
      } finally {
        await removeFailure()
      }

      expect(response.status).toBe(500)
      await expectNothingRegistered('Atomic sizes')
      await expect(countRows(fixture, 'product_sizes')).resolves.toBe(0)
      await expect(countRows(fixture, 'product_accompaniments')).resolves.toBe(0)
      await expect(countRows(fixture, 'stock_balances')).resolves.toBe(0)
      await expect(countRows(fixture, 'stock_transactions')).resolves.toBe(0)
      await expect(
        findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME),
      ).resolves.toEqual([])
    })

    async function expectNothingRegistered(name: string) {
      await expect(
        fixture.products.findByName(establishmentId, name),
      ).resolves.toBeUndefined()
      await expect(countRows(fixture, 'product_sizes')).resolves.toBe(0)
      await expect(findEvents(fixture, ProductCreatedEvent._NAME)).resolves.toEqual([])
    }
  })

  describe('global accompaniments', () => {
    it('gives a newly registered Portion one row for every global, with shared values', async () => {
      const type = await fixture.addAccompanimentType({
        establishmentId: MrpModuleFixture.accounts.establishmentId,
        name: 'Registration Type',
      })
      const existingPortion = await fixture.addProduct(
        createProduct({
          name: 'Existing Registration Portion',
          categories: [ProductCategory.Portion],
        }),
      )
      const targets = [
        await fixture.addProduct(
          createProduct({
            name: 'Registration Granola',
            categories: [ProductCategory.Accompaniment],
            accompanimentPrice: 3,
          }),
        ),
        await fixture.addProduct(
          createProduct({
            name: 'Registration Banana',
            categories: [ProductCategory.Accompaniment],
            accompanimentPrice: 2,
          }),
        ),
      ]
      const globals: GlobalAccompaniment[] = []
      for (const [index, target] of targets.entries()) {
        const { global } = await addGlobalAccompanimentWithRows(fixture, {
          target,
          type,
          portions: [existingPortion],
          quantityPerPortion: 0.05 * (index + 1),
        })
        globals.push(global)
      }

      const response = await request(fixture.app.getHttpServer())
        .post('/products')
        .set('Cookie', managerRequestAuthorization())
        .send({
          name: 'Registered Global Portion',
          unit: 'kg',
          categories: ['portion'],
          stockControl: 'single',
          allowNegativeStock: false,
          idealStock: 0,
        })

      expect(response.status).toBe(201)
      const rows = await fixture.productAccompaniments.findManyByProductId(
        MrpModuleFixture.accounts.establishmentId,
        response.body.id,
      )
      expect(rows).toHaveLength(2)
      expect(rows).toEqual(
        expect.arrayContaining(
          globals.map((global) =>
            expect.objectContaining({
              productId: response.body.id,
              accompanimentProductId: global.accompanimentProductId,
              accompanimentTypeId: type.id,
              quantityPerPortion: global.quantityPerPortion,
              globalAccompanimentId: global.id,
            }),
          ),
        ),
      )
      const table = await request(fixture.app.getHttpServer())
        .get(`/products/${response.body.id}/accompaniments`)
        .set('Cookie', managerRequestAuthorization())
      expect(
        table.body.accompaniments.map((item: { isGlobal: boolean }) => item.isGlobal),
      ).toEqual([true, true])
    })

    it('does not add rows to products registered without the Portion category', async () => {
      const type = await fixture.addAccompanimentType({
        establishmentId: MrpModuleFixture.accounts.establishmentId,
        name: 'Ignored Type',
      })
      const target = await fixture.addProduct(
        createProduct({
          name: 'Ignored Granola',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 3,
        }),
      )
      await addGlobalAccompanimentWithRows(fixture, { target, type, portions: [] })

      const response = await request(fixture.app.getHttpServer())
        .post('/products')
        .set('Cookie', managerRequestAuthorization())
        .send({
          name: 'Registered Ingredient',
          unit: 'kg',
          categories: ['ingredient'],
          stockControl: 'single',
          allowNegativeStock: false,
          idealStock: 0,
        })

      expect(response.status).toBe(201)
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          MrpModuleFixture.accounts.establishmentId,
          response.body.id,
        ),
      ).resolves.toEqual([])
    })
  })
})
