import { ProductCategory } from '@scoops/core/mrp/domain/structures'
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

describe('Update Product Accompaniment Controller [PATCH /products/:productId/accompaniments/:linkId]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates only the type and quantity and preserves the target', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Update Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Immutable Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const originalType = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Original',
    })
    const replacementType = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Replacement',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: originalType.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ accompanimentTypeId: replacementType.id, quantityPerPortion: 2.125 })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: link.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: replacementType.id,
      accompanimentTypeName: 'Replacement',
      quantityPerPortion: 2.125,
    })
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      accompanimentTypeId: replacementType.id,
      quantityPerPortion: 2.125,
    })
  })

  it('returns safe validation, authorization, and ownership errors', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Error Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Error Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Type',
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
        name: 'Foreign Update Portion',
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const malformed = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 1.1234 })
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Authorization', operatorRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${foreignOwner.id}/accompaniments/${link.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })
    const missing = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/00000000-0000-4000-8000-000000000099`)
      .set('Authorization', managerRequestAuthorization())
      .send({ accompanimentTypeId: type.id, quantityPerPortion: 2 })

    expect(malformed.status).toBe(422)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({ quantityPerPortion: 1, accompanimentTypeId: type.id })
  })

  it('rejects a missing type without changing the existing link', async () => {
    const owner = await fixture.addProduct(
      createProduct({
        name: 'Missing Type Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Missing Type Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Existing',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${owner.id}/accompaniments/${link.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({
        accompanimentTypeId: '00000000-0000-4000-8000-000000000099',
        quantityPerPortion: 2,
      })

    expect(response.status).toBe(404)
    await expect(
      fixture.productAccompaniments.findById(owner.establishmentId, owner.id, link.id),
    ).resolves.toMatchObject({ quantityPerPortion: 1, accompanimentTypeId: type.id })
  })
})
