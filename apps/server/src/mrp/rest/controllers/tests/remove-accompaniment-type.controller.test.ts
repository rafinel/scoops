import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Remove Accompaniment Type Controller [DELETE /accompaniment-types/:typeId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('removes an unused type and returns no content', async () => {
    const type = await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Unused',
    })

    const response = await request(fixture.app.getHttpServer())
      .delete(`/accompaniment-types/${type.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(204)
    await expect(
      fixture.accompanimentTypes.findById(
        '41000000-0000-0000-0000-000000000001',
        type.id,
      ),
    ).resolves.toBeUndefined()
  })

  it('protects an in-use type and keeps both type and link intact', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Used Type Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Used Type Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'In Use',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .delete(`/accompaniment-types/${type.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(409)
    await expect(
      fixture.accompanimentTypes.findById(owner.establishmentId, type.id),
    ).resolves.toMatchObject({ id: type.id })
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({ accompanimentTypeId: type.id })
  })

  it('preserves integrity when a link races with type removal', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Race Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({ name: 'Race Target', categories: [ProductCategory.Accompaniment] }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Race',
    })

    const [linkResult, removeResult] = await Promise.allSettled([
      fixture.addProductAccompaniment({
        establishmentId: owner.establishmentId,
        productId: owner.id,
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      }),
      request(fixture.app.getHttpServer())
        .delete(`/accompaniment-types/${type.id}`)
        .set('Cookie', managerRequestAuthorization()),
    ])
    const persistedType = await fixture.accompanimentTypes.findById(
      owner.establishmentId,
      type.id,
    )
    const persistedLinks = await fixture.productAccompaniments.findManyByProductId(
      owner.establishmentId,
      owner.id,
    )

    expect(removeResult.status).toBe('fulfilled')
    if (linkResult.status === 'fulfilled') {
      expect(removeResult.value.status).toBe(409)
      expect(persistedType).toBeDefined()
      expect(persistedLinks).toHaveLength(1)
    } else {
      expect(removeResult.value.status).toBe(204)
      expect(persistedType).toBeUndefined()
      expect(persistedLinks).toEqual([])
    }
  })

  it('returns safe tenant, authorization, and malformed-id responses', async () => {
    const type = await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Visible',
    })
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: '42000000-0000-0000-0000-000000000001',
      name: 'Foreign',
    })
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/accompaniment-types/${type.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/accompaniment-types/${foreignType.id}`)
      .set('Cookie', managerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .delete('/accompaniment-types/00000000-0000-4000-8000-000000000099')
      .set('Cookie', foreignManagerRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .delete('/accompaniment-types/not-a-uuid')
      .set('Cookie', managerRequestAuthorization())

    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.title).toBe(missing.body.title)
    expect(malformed.status).toBe(400)
  })
})
