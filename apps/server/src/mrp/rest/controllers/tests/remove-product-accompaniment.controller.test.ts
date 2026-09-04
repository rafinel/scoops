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

describe('Remove Product Accompaniment Controller [DELETE /products/:productId/accompaniments/:linkId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('removes only the link and preserves stock and history snapshots', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Remove Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Remove Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Topping',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    await fixture.balances.initialize(target.id)
    await fixture.balances.add({ productId: target.id }, 4)
    await fixture.transactions.add({
      establishmentId: target.establishmentId,
      productId: target.id,
      productName: target.name,
      unit: target.unit,
      type: 'entry',
      quantity: 4,
      balanceAfter: 4,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    })
    const beforeBalance = await fixture.balances.findByProductId(target.id)
    const beforeTransactions = await fixture.transactions.findPage(
      target.establishmentId,
      target.id,
      { page: 1, limit: 20 },
    )

    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(204)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toBeUndefined()
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

  it('returns uniform not-found and authorization responses', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Delete Error Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Delete Error Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Topping',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const foreignOwner = await fixture.addProduct(
      createProduct({
        name: 'Foreign Delete Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).delete(
      `/products/${owner.id}/accompaniments/${link.id}`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/products/${foreignOwner.id}/accompaniments/${link.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .delete(
        '/products/00000000-0000-4000-8000-000000000099/accompaniments/00000000-0000-4000-8000-000000000099',
      )
      .set('Cookie', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.title).toBe(missing.body.title)
  })

  it('rejects malformed identifiers before executing the use case', async () => {
    const response = await request(fixture.app.getHttpServer())
      .delete('/products/not-a-uuid/accompaniments/not-a-uuid')
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(400)
  })
})
