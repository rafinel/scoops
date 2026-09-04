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

describe('Remove Product Size Controller [DELETE /products/:productId/sizes/:sizeId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('removes the owned size, including the final active size, without touching stock history', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Remove Portion', categories: [ProductCategory.Portion] }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Disposable',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const beforeTransactions = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(204)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toBeUndefined()
    const afterTransactions = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(afterTransactions.items).toEqual(beforeTransactions.items)
  })

  it('enforces authentication, ownership, category, and identifier validation', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Protected Remove Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Protected',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const ingredient = await fixture.addProduct(createProduct({ name: 'Not Portion' }))
    const anonymous = await request(fixture.app.getHttpServer()).delete(
      `/products/${product.id}/sizes/${size.id}`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const wrongCategory = await request(fixture.app.getHttpServer())
      .delete(`/products/${ingredient.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/sizes/not-a-uuid`)
      .set('Cookie', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(wrongCategory.status).toBe(400)
    expect(malformed.status).toBe(400)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toBeDefined()
  })
})
