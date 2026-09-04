import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Save Single Resale Configuration Controller [PUT /products/:productId/resale-configuration]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('upserts one Single configuration and returns the authoritative subsequent read', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Single Resale', categories: [ProductCategory.Resale] }),
    )
    const first = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/resale-configuration`)
      .set('Cookie', managerRequestAuthorization())
      .send({ price: 12.5, isActive: true })
    const firstConfigurationId = first.body.resale[0].configuration.id
    const second = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/resale-configuration`)
      .set('Cookie', managerRequestAuthorization())
      .send({ price: 14.75, isActive: false })
    const read = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/pricing`)
      .set('Cookie', managerRequestAuthorization())

    expect(first.status).toBe(200)
    expect(first.body).toMatchObject({
      mode: 'resale-single',
      resale: [{ packageQuantity: 1, price: 12.5, isActive: true }],
    })
    expect(first.body.resale[0]).not.toHaveProperty('packageQuantity', undefined)
    expect(second.status).toBe(200)
    expect(second.body.resale[0]).toMatchObject({
      packageQuantity: 1,
      price: 14.75,
      isActive: false,
      configuration: { id: firstConfigurationId },
    })
    expect(read.status).toBe(200)
    expect(read.body.resale[0]).toMatchObject({
      packageQuantity: 1,
      price: 14.75,
      isActive: false,
      configuration: { id: firstConfigurationId },
    })
    await expect(
      fixture.resaleConfigurations.findManyByProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toHaveLength(1)
    await expect(
      fixture.transactions.findPage(product.establishmentId, product.id, {
        page: 1,
        limit: 20,
      }),
    ).resolves.toMatchObject({ items: [] })
  })

  it('rejects malformed input and non-Single products before persistence', async () => {
    const resale = await fixture.addProduct(
      createProduct({ name: 'Malformed Single', categories: [ProductCategory.Resale] }),
    )
    const portion = await fixture.addProduct(
      createProduct({ name: 'Portion Target', categories: [ProductCategory.Portion] }),
    )
    const malformed = await request(fixture.app.getHttpServer())
      .put(`/products/${resale.id}/resale-configuration`)
      .set('Cookie', managerRequestAuthorization())
      .send({ price: -1, isActive: true })
    const wrongCategory = await request(fixture.app.getHttpServer())
      .put(`/products/${portion.id}/resale-configuration`)
      .set('Cookie', managerRequestAuthorization())
      .send({ price: 10, isActive: true })

    expect(malformed.status).toBe(422)
    expect(wrongCategory.status).toBe(400)
    await expect(
      fixture.resaleConfigurations.findManyByProductId(resale.establishmentId, resale.id),
    ).resolves.toHaveLength(0)
  })

  it('enforces authentication and tenant ownership', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Protected Single', categories: [ProductCategory.Resale] }),
    )
    const anonymous = await request(fixture.app.getHttpServer()).put(
      `/products/${product.id}/resale-configuration`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/resale-configuration`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ price: 10, isActive: true })
    const foreign = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/resale-configuration`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ price: 10, isActive: true })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
