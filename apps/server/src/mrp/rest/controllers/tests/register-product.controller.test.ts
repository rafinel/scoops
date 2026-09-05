import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  foreignManagerRequestAuthorization,
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
})
