import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Rename Accompaniment Type Controller [PATCH /accompaniment-types/:typeId]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('renames a shared type while preserving its identity and links', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Rename Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Rename Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Old Name',
    })
    const link = await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/accompaniment-types/${type.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '  New Name  ' })
    const linked = await request(fixture.app.getHttpServer())
      .get(`/products/${owner.id}/accompaniments`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: type.id, name: 'New Name' })
    expect(linked.body.accompaniments[0]).toMatchObject({
      id: link.id,
      accompanimentTypeId: type.id,
      accompanimentTypeName: 'New Name',
    })
  })

  it('rejects duplicate, foreign, malformed, and unauthorized renames', async () => {
    const type = await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Original',
    })
    const duplicate = await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Taken',
    })
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: '42000000-0000-0000-0000-000000000001',
      name: 'Foreign',
    })
    const duplicateResponse = await request(fixture.app.getHttpServer())
      .patch(`/accompaniment-types/${type.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ name: duplicate.name })
    const foreignResponse = await request(fixture.app.getHttpServer())
      .patch(`/accompaniment-types/${foreignType.id}`)
      .set('Authorization', managerRequestAuthorization())
      .send({ name: 'Hidden' })
    const malformed = await request(fixture.app.getHttpServer())
      .patch('/accompaniment-types/not-a-uuid')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: 'Hidden' })
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/accompaniment-types/${type.id}`)
      .set('Authorization', operatorRequestAuthorization())
      .send({ name: 'Hidden' })

    expect(duplicateResponse.status).toBe(409)
    expect(foreignResponse.status).toBe(404)
    expect(malformed.status).toBe(400)
    expect(operator.status).toBe(403)
    await expect(
      fixture.accompanimentTypes.findById(
        '41000000-0000-0000-0000-000000000001',
        type.id,
      ),
    ).resolves.toMatchObject({ name: 'Original' })
  })

  it('returns not found uniformly for a missing type', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/accompaniment-types/00000000-0000-4000-8000-000000000099')
      .set('Authorization', foreignManagerRequestAuthorization())
      .send({ name: 'Hidden' })

    expect(response.status).toBe(404)
  })
})
