import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Create Accompaniment Type Controller [POST /accompaniment-types]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('creates one trimmed type and returns ISO lifecycle dates', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '  Sprinkles  ' })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Sprinkles',
    })
    expect(response.body.createdAt).toEqual(expect.any(String))
    expect(response.body.updatedAt).toEqual(expect.any(String))
    await expect(
      fixture.accompanimentTypes.findByName(
        '41000000-0000-0000-0000-000000000001',
        'sprinkles',
      ),
    ).resolves.toMatchObject({ name: 'Sprinkles' })
  })

  it('rejects case-insensitive duplicates and malformed input without a second row', async () => {
    await fixture.addAccompanimentType({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      name: 'Sauce',
    })
    const duplicate = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: ' sauce ' })
    const malformed = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '' })

    expect(duplicate.status).toBe(409)
    expect(malformed.status).toBe(422)
    const page = await fixture.accompanimentTypes.findPage({
      establishmentId: '41000000-0000-0000-0000-000000000001',
      page: 1,
      pageSize: 10,
    })
    expect(page.total).toBe(1)
  })

  it('enforces authentication and Manager authorization per tenant', async () => {
    const anonymous = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .send({ name: 'Anonymous' })
    const operator = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .set('Authorization', operatorRequestAuthorization())
      .send({ name: 'Operator' })
    const foreignManager = await request(fixture.app.getHttpServer())
      .post('/accompaniment-types')
      .set('Authorization', foreignManagerRequestAuthorization())
      .send({ name: 'Foreign' })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreignManager.status).toBe(201)
    expect(foreignManager.body.establishmentId).toBe(
      '42000000-0000-0000-0000-000000000001',
    )
  })
})
