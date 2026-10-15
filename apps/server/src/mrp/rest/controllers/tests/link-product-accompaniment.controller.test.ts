import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Link Product Accompaniment Controller [POST /products/:productId/accompaniments]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('persists one tenant-qualified link without changing stock', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Link Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Link Target',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 4,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Syrup',
    })
    await fixture.balances.initialize(target.id)
    await fixture.balances.add({ productId: target.id }, 7)
    const beforeBalance = await fixture.balances.findByProductId(target.id)
    const beforeTransactions = await fixture.transactions.findPage(
      target.establishmentId,
      target.id,
      { page: 1, limit: 20 },
    )

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.25,
        accompanimentPrice: 7.5,
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Syrup',
      quantityPerPortion: 1.25,
      unitCost: 4,
      estimatedCost: 5,
      salePrice: 7.5,
    })
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 7.5, currentUnitCost: 4 })
    await expect(
      fixture.productAccompaniments.findByProductAndAccompaniment(
        owner.establishmentId,
        owner.id,
        target.id,
      ),
    ).resolves.toMatchObject({ quantityPerPortion: 1.25 })
    await expect(fixture.balances.findByProductId(target.id)).resolves.toEqual(
      beforeBalance,
    )
    await expect(
      fixture.transactions.findPage(target.establishmentId, target.id, {
        page: 1,
        limit: 20,
      }),
    ).resolves.toEqual(beforeTransactions)
  })

  it('returns safe validation, eligibility, duplicate, and tenant conflicts', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Conflict Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Conflict Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const inactiveTarget = await fixture.addProduct(
      createProduct({
        name: 'Inactive Target',
        categories: [ProductCategory.Accompaniment],
        status: 'inactive',
      }),
    )
    const foreignTarget = await fixture.addProduct(
      createProduct({
        name: 'Foreign Target',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Sauce',
    })
    const body = {
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 4.25,
    }
    await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)

    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    const malformed = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, quantityPerPortion: 0 })
    const inactive = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })
    const foreignTargetResponse = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: foreignTarget.id })
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })
    const foreignOwner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )
    const foreign = await request(fixture.app.getHttpServer())
      .post(`/products/${foreignOwner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })

    expect(duplicate.status).toBe(409)
    expect(malformed.status).toBe(422)
    expect(inactive.status).toBe(400)
    expect(foreignTargetResponse.status).toBe(404)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toHaveLength(1)
  })

  it('rejects a foreign type and malformed path without partial writes', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Type Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Foreign Type Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
      name: 'Foreign Type',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3,
      })
    const malformedPath = await request(fixture.app.getHttpServer())
      .post('/products/not-a-uuid/accompaniments')
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3,
      })

    expect(response.status).toBe(404)
    expect(malformedPath.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])
  })

  it('requires a primary brand for a By-brand accompaniment', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Brand Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Brand Target',
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Crunch',
    })
    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 5,
      })

    expect(response.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])
  })

  it('requires a valid price for the first link and accepts zero as a saved price', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Price Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Free Topping',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 1.25,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Free Toppings',
    })
    const body = {
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 2,
    }

    const missingPrice = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send(body)
    expect(missingPrice.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])

    const excessivePrecision = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 1.001 })
    const exceedsNumericPrecision = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 10_000_000_000_000_000 })
    const nullPrice = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: null })
    const negative = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: -1 })
    const free = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({ ...body, accompanimentPrice: 0 })

    expect(excessivePrecision.status).toBe(422)
    expect(exceedsNumericPrecision.status).toBe(422)
    expect(nullPrice.status).toBe(422)
    expect(negative.status).toBe(422)
    expect(free.status).toBe(201)
    expect(free.body.salePrice).toBe(0)
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 0 })
  })

  it('allows an older client to omit price when the target already has one', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Existing Price Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Previously Configured Topping',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 9.25,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

    expect(response.status).toBe(201)
    expect(response.body.salePrice).toBe(9.25)
    await expect(
      fixture.products.findById(target.establishmentId, target.id),
    ).resolves.toMatchObject({ accompanimentPrice: 9.25 })
  })
})
