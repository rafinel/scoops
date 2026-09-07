import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { ProductStockAlertStateEnteredEvent } from '@scoops/core/mrp/domain/events'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import { DrizzleEventsRepository } from '@/shared/database/drizzle/repositories/drizzle-events-repository'

import {
  createProduct,
  findEvents,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Register Production Controller [POST /products/:productId/productions]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('atomically creates production, balances, and correlated stock movements', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable], idealStock: 10 }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 2, idealStock: 5 }),
    )
    await fixture.balances.initialize(product.id)
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 5)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Cookie', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })

    const registered = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/productions`)
      .set('Cookie', managerRequestAuthorization())
      .send({ quantity: 4 })

    expect(registered.status).toBe(201)
    expect(registered.body).toMatchObject({
      productId: product.id,
      quantity: 4,
      totalCost: 4,
      performedByName: 'Maria Manager',
    })
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 4,
    })
    await expect(fixture.balances.findByProductId(ingredient.id)).resolves.toMatchObject({
      quantity: 3,
    })
    const movements = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(movements.items).toMatchObject([
      {
        type: 'production-output',
        productionId: registered.body.id,
        quantity: 4,
        balanceAfter: 4,
      },
    ])
    const events = await findEvents(
      fixture,
      ProductStockAlertStateEnteredEvent._NAME,
    )
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            productId: ingredient.id,
            state: 'below-ideal',
            availableQuantity: 3,
            idealQuantity: 5,
          }),
        }),
      ]),
    )
  })

  it('rolls back production, balances, and ledger when an alert publication fails', async () => {
    const product = await fixture.addProduct(
      createProduct({ categories: [ProductCategory.Manufacturable], idealStock: 10 }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Milk', currentUnitCost: 2, idealStock: 5 }),
    )
    await fixture.balances.initialize(product.id)
    await fixture.balances.initialize(ingredient.id)
    await fixture.balances.add({ productId: ingredient.id }, 5)
    await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/recipe`)
      .set('Cookie', managerRequestAuthorization())
      .send({ yieldQuantity: 2 })
    await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/recipe/ingredients`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ingredientProductId: ingredient.id, quantity: 1 })

    const addSpy = vi
      .spyOn(DrizzleEventsRepository.prototype, 'add')
      .mockRejectedValueOnce(new Error('Injected notification publication failure.'))

    try {
      const response = await request(fixture.app.getHttpServer())
        .post(`/products/${product.id}/productions`)
        .set('Cookie', managerRequestAuthorization())
        .send({ quantity: 4 })
      expect(response.status).toBe(500)
      await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
        quantity: 0,
      })
      await expect(
        fixture.balances.findByProductId(ingredient.id),
      ).resolves.toMatchObject({ quantity: 5 })
      await expect(
        fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        }),
      ).resolves.toMatchObject({ items: [] })
      await expect(
        fixture.transactions.findPage(product.establishmentId, ingredient.id, {
          page: 1,
          limit: 20,
        }),
      ).resolves.toMatchObject({ items: [] })
    } finally {
      addSpy.mockRestore()
    }
  })
})
