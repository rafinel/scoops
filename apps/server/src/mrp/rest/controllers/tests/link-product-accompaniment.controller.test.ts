import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
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
  let auth: SupabaseAuthFixture

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
      .set('Authorization', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.25,
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'Syrup',
      quantityPerPortion: 1.25,
      unitCost: 4,
      estimatedCost: 5,
    })
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
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Sauce',
    })
    const body = {
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    }
    await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
      .send(body)

    const duplicate = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
      .send(body)
    const malformed = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ...body, quantityPerPortion: 0 })
    const inactive = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })
    const operator = await request(fixture.app.getHttpServer())
      .post(`/products/${owner.id}/accompaniments`)
      .set('Authorization', operatorRequestAuthorization())
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
      .set('Authorization', managerRequestAuthorization())
      .send({ ...body, accompanimentProductId: inactiveTarget.id })

    expect(duplicate.status).toBe(409)
    expect(malformed.status).toBe(422)
    expect(inactive.status).toBe(400)
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
      .set('Authorization', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
      })
    const malformedPath = await request(fixture.app.getHttpServer())
      .post('/products/not-a-uuid/accompaniments')
      .set('Authorization', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: foreignType.id,
        quantityPerPortion: 1,
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
      .set('Authorization', managerRequestAuthorization())
      .send({
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      })

    expect(response.status).toBe(400)
    await expect(
      fixture.productAccompaniments.findManyByProductId(owner.establishmentId, owner.id),
    ).resolves.toEqual([])
  })
})
