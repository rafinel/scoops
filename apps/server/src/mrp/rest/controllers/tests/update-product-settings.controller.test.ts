import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  expectedUpdatedAt,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Update Product Settings Controller [PATCH /products/:productId/settings]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('persists field changes and explicit clears through the real database', async () => {
    const product = await fixture.addProduct(
      createProduct({ idealStock: 4.125, internalNotes: 'old notes' }),
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: '  Updated Chocolate  ',
        idealStock: null,
        internalNotes: null,
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    expect(response.body.product).toMatchObject({
      name: 'Updated Chocolate',
      idealStock: null,
      internalNotes: null,
    })
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      name: 'Updated Chocolate',
      idealStock: undefined,
      internalNotes: undefined,
    })
  })

  it('rejects stale versions and strict bodies without changing the product', async () => {
    const product = await fixture.addProduct(createProduct())
    const changed = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'First update', expectedUpdatedAt: expectedUpdatedAt(product) })
    expect(changed.status).toBe(200)

    const stale = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Stale update', expectedUpdatedAt: expectedUpdatedAt(product) })
    const unknownField = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .set('Cookie', managerRequestAuthorization())
      .send({ unit: 'g', expectedUpdatedAt: changed.body.product.updatedAt })

    expect(stale.status).toBe(409)
    expect(unknownField.status).toBe(422)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      name: 'First update',
      unit: product.unit,
    })
  })

  it('rejects anonymous, operator, and foreign-establishment writes', async () => {
    const product = await fixture.addProduct(createProduct())
    const foreignProduct = await fixture.addProduct(
      createProduct({
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        name: 'Foreign Chocolate',
      }),
    )
    const body = {
      name: 'Attempted update',
      expectedUpdatedAt: expectedUpdatedAt(product),
    }

    const anonymous = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/settings`)
      .set('Cookie', operatorRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${foreignProduct.id}/settings`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: 'Leaked update',
        expectedUpdatedAt: expectedUpdatedAt(foreignProduct),
      })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    await expect(
      fixture.products.findById(foreignProduct.establishmentId, foreignProduct.id),
    ).resolves.toMatchObject({ name: 'Foreign Chocolate' })
  })
})
