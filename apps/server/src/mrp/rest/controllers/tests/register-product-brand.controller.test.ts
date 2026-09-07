import {
  ProductSalesConfigurationChangedEvent,
  ProductStockAlertStateEnteredEvent,
} from '@scoops/core/mrp/domain/events'
import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
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

describe('Register Product Brand Controller [POST /products/:productId/brands]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('makes the first brand primary and atomically records positive initial stock', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand, idealStock: 10 }),
    )
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        name: '  Callebaut  ',
        packageQuantity: 2,
        packageValue: 30,
        initialQuantity: 5,
      })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      brand: { name: 'Callebaut', isPrimary: true },
      stockQuantity: 5,
      unitPrice: 15,
    })
    const page = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items).toHaveLength(1)
    expect(page.items[0]).toMatchObject({
      type: 'entry',
      quantity: 5,
      balanceAfter: 5,
      productName: 'Chocolate',
      brandName: 'Callebaut',
      performedByName: 'Maria Manager',
    })
    const configurationEvents = await findEvents(
      fixture,
      ProductSalesConfigurationChangedEvent._NAME,
    )
    expect(configurationEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            productId: product.id,
            state: 'available',
            configuration: expect.objectContaining({
              stockControl: ProductStockControl.ByBrand,
            }),
          }),
        }),
      ]),
    )
    await expect(
      findEvents(fixture, ProductStockAlertStateEnteredEvent._NAME),
    ).resolves.toHaveLength(0)
  })

  it('creates no ledger row for zero stock and rolls back duplicate registration', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const body = {
      name: 'Sicao',
      packageQuantity: 2,
      packageValue: 10,
      initialQuantity: 0,
    }
    expect(
      (
        await request(fixture.app.getHttpServer())
          .post(`/products/${product.id}/brands`)
          .set('Cookie', managerRequestAuthorization())
          .send(body)
      ).status,
    ).toBe(201)
    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, name: ' Sicao ' })
    expect(duplicate.status).toBe(409)
    expect(await fixture.brands.findManyByProductId(product.id)).toHaveLength(1)
    expect(
      (
        await fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        })
      ).items,
    ).toHaveLength(0)
  })

  it('commits stock before post-transaction configuration publication failure', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand, idealStock: 10 }),
    )
    const addSpy = vi
      .spyOn(DrizzleEventsRepository.prototype, 'add')
      .mockRejectedValueOnce(new Error('Injected notification publication failure.'))

    try {
      const response = await request(fixture.app.getHttpServer())
        .post(`/products/${product.id}/brands`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          name: 'Rollback brand',
          packageQuantity: 1,
          packageValue: 10,
          initialQuantity: 5,
        })
      expect(response.status).toBe(500)
      expect(await fixture.brands.findManyByProductId(product.id)).toHaveLength(0)
      expect(await fixture.balances.findManyByProductId(product.id)).toHaveLength(0)
      await expect(
        fixture.transactions.findPage(product.establishmentId, product.id, {
          page: 1,
          limit: 20,
        }),
      ).resolves.toMatchObject({
        items: [],
      })
    } finally {
      addSpy.mockRestore()
    }
  })

  it('rejects malformed values before persistence', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${product.id}/brands`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '', packageQuantity: 0, packageValue: -1, initialQuantity: -1 })
    expect(response.status).toBe(422)
    expect(await fixture.brands.findManyByProductId(product.id)).toHaveLength(0)
  })
})
