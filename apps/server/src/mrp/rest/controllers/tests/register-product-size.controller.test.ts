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

describe('Register Product Size Controller [POST /products/:productId/sizes]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('registers an active size, refreshes pricing, and persists the normalized name', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Register Portion', categories: [ProductCategory.Portion] }),
    )
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/sizes`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '  Medium  ', quantity: 0.75, price: 10.5 })

    expect(response.status).toBe(201)
    expect(response.body.sizes).toHaveLength(1)
    expect(response.body.sizes[0].size).toMatchObject({
      name: 'Medium',
      quantity: 0.75,
      price: 10.5,
      isActive: true,
    })
    await expect(
      fixture.productSizes.findManyByProductId(product.establishmentId, product.id),
    ).resolves.toMatchObject([{ name: 'Medium', quantity: 0.75, isActive: true }])
  })

  it('rejects malformed and duplicate names without changing persistence', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Validation Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Existing',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const malformed = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/sizes`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '', quantity: 0, price: -1 })
    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/sizes`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: ' existing ', quantity: 1.25, price: 11 })

    expect(malformed.status).toBe(422)
    expect(duplicate.status).toBe(409)
    await expect(
      fixture.productSizes.findManyByProductId(product.establishmentId, product.id),
    ).resolves.toHaveLength(1)
  })

  it('protects the action with Manager authorization, tenant ownership, and category rules', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Protected Portion', categories: [ProductCategory.Portion] }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Ingredient Target' }),
    )
    const anonymous = await request(fixture.app.getHttpServer()).post(
      `/products/${product.id}/sizes`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/sizes`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ name: 'Size', quantity: 1, price: 2 })
    const foreign = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/sizes`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ name: 'Size', quantity: 1, price: 2 })
    const wrongCategory = await request(fixture.app.getHttpServer())
      .post(`/products/${ingredient.id}/sizes`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Size', quantity: 1, price: 2 })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(wrongCategory.status).toBe(400)
  })
})
