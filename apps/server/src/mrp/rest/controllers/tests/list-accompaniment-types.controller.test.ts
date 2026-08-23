import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('List Accompaniment Types Controller [GET /accompaniment-types]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns stable tenant-qualified pagination and live usage counts', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Types Portion', categories: [ProductCategory.Portion] }),
    )
    const target = await fixture.addProduct(
      createProduct({
        name: 'Types Target',
        categories: [ProductCategory.Accompaniment],
      }),
    )
    const usedType = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Type 02',
    })
    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: usedType.id,
      quantityPerPortion: 1,
    })
    for (const index of [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      await fixture.addAccompanimentType({
        establishmentId: owner.establishmentId,
        name: `Type ${String(index).padStart(2, '0')}`,
      })
    }
    const foreignType = await fixture.addAccompanimentType({
      establishmentId: '42000000-0000-0000-0000-000000000001',
      name: 'Foreign Type',
    })

    const firstPage = await request(fixture.app.getHttpServer())
      .get('/accompaniment-types?page=1&pageSize=10')
      .set('Authorization', managerRequestAuthorization())
    const secondPage = await request(fixture.app.getHttpServer())
      .get('/accompaniment-types?page=2&pageSize=10')
      .set('Authorization', managerRequestAuthorization())

    expect(firstPage.status).toBe(200)
    expect(firstPage.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 12,
      totalPages: 2,
    })
    expect(
      firstPage.body.items.map((item: { type: { name: string } }) => item.type.name),
    ).toEqual([
      'Type 01',
      'Type 02',
      'Type 03',
      'Type 04',
      'Type 05',
      'Type 06',
      'Type 07',
      'Type 08',
      'Type 09',
      'Type 10',
    ])
    expect(firstPage.body.items[1]).toMatchObject({
      type: { id: usedType.id },
      usageCount: 1,
    })
    expect(secondPage.status).toBe(200)
    expect(
      secondPage.body.items.map((item: { type: { name: string } }) => item.type.name),
    ).toEqual(['Type 11', 'Type 12'])
    expect(JSON.stringify(firstPage.body)).not.toContain(foreignType.id)
  })

  it('normalizes search and clamps a page beyond the last page', async () => {
    await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Chocolate Sauce',
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/accompaniment-types?search=%20chocolate%20&page=99&pageSize=10')
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ page: 1, total: 1, totalPages: 1 })
    expect(response.body.items[0].type.name).toBe('Chocolate Sauce')
  })

  it('enforces authentication and Manager authorization', async () => {
    const anonymous = await request(fixture.app.getHttpServer()).get(
      '/accompaniment-types',
    )
    const operator = await request(fixture.app.getHttpServer())
      .get('/accompaniment-types')
      .set('Authorization', operatorRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .get('/accompaniment-types?page=0')
      .set('Authorization', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(malformed.status).toBe(422)
  })
})
