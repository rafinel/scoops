import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import {
  addPortionWithGlobalAccompaniment,
  comboCreate,
  productCreate,
} from './combo-controller-test-helpers'
import { addStock } from './sales-catalog-controller-test-helpers'

describe('Create Combo Controller [POST /discounts]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('creates an inactive Combo, persists it, and publishes its domain event', async () => {
    const { establishmentId: _establishmentId, ...body } = comboCreate()

    const response = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', managerRequestAuthorization())
      .send(body)

    expect(response.status).toBe(201)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.combo).toMatchObject({
      establishmentId: '43000000-0000-0000-0000-000000000001',
      name: 'Chocolate Combo',
      status: 'inactive',
      fixedPrice: 15,
      components: body.components,
    })
    const persisted = await fixture.discounts.findById(
      '43000000-0000-0000-0000-000000000001',
      response.body.combo.id,
    )
    expect(persisted?.name).toBe('Chocolate Combo')
    expect(fixture.broker.events.at(-1)?.name).toBe('pdv/discount.created')
  })

  it('creates an active Combo whose Portion component selects a global accompaniment', async () => {
    const { components } = await addPortionWithGlobalAccompaniment(fixture)

    const response = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Global Combo', status: 'active', fixedPrice: 15, components })

    expect(response.status).toBe(201)
    expect(response.body.combo).toMatchObject({
      name: 'Global Combo',
      status: 'active',
      fixedPrice: 15,
      components,
    })
    await expect(
      fixture.discounts.findById(
        '43000000-0000-0000-0000-000000000001',
        response.body.combo.id,
      ),
    ).resolves.toMatchObject({ status: 'active', components })
  })

  it('creates an active Combo whose priced components are out of stock', async () => {
    const resales = await Promise.all(
      ['Sold Out Resale One', 'Sold Out Resale Two'].map(async (name) => {
        const resale = await fixture.addProduct(
          productCreate({ name, categories: [ProductCategory.Resale] }),
        )
        await fixture.addResaleConfiguration({
          establishmentId: resale.establishmentId,
          productId: resale.id,
          price: 5,
          isActive: true,
        })
        await addStock(fixture, resale.id, false)
        return resale
      }),
    )
    const components = resales.map(({ id }) => ({
      kind: 'resale' as const,
      productId: id,
      quantity: 1,
    }))

    const response = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Sold Out Combo', status: 'active', fixedPrice: 8, components })

    expect(response.status).toBe(201)
    expect(response.body.combo).toMatchObject({ status: 'active', components })
    const catalog = await request(fixture.app.getHttpServer())
      .get('/discounts/catalog?search=Sold%20Out%20Resale')
      .set('Cookie', managerRequestAuthorization())
    expect(catalog.body.items).toEqual([
      expect.objectContaining({ availability: 'out_of_stock' }),
      expect.objectContaining({ availability: 'out_of_stock' }),
    ])
  })

  it('rejects an active Combo selecting a global row that no longer exists on the Portion', async () => {
    const { row, components } = await addPortionWithGlobalAccompaniment(fixture)
    await fixture.productAccompaniments.remove(row.establishmentId, row.productId, row.id)

    const response = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Stale Global Combo',
        status: 'active',
        fixedPrice: 15,
        components,
      })

    expect(response.status).toBe(400)
    await expect(
      fixture.discounts.findPage({
        establishmentId: '43000000-0000-0000-0000-000000000001',
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toMatchObject({ total: 0 })
  })

  it('rejects malformed bodies and non-Manager callers without persistence', async () => {
    const malformed = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '', status: 'inactive', fixedPrice: 1, components: [] })
    const operator = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Cookie', operatorRequestAuthorization())
      .send(comboCreate())

    expect(malformed.status).toBe(422)
    expect(operator.status).toBe(403)
    await expect(
      fixture.discounts.findPage({
        establishmentId: '43000000-0000-0000-0000-000000000001',
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toMatchObject({ total: 0 })
  })
})
