import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { comboCreate } from './combo-controller-test-helpers'

describe('List Combos Controller [GET /discounts]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns a paged tenant-scoped Combo projection for Managers', async () => {
    const first = await fixture.addCombo(comboCreate({ name: 'First Combo' }))
    const second = await fixture.addCombo(comboCreate({ name: 'Second Combo' }))
    await fixture.addCombo(
      comboCreate({
        establishmentId: '44000000-0000-0000-0000-000000000001',
        name: 'Foreign Combo',
      }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get('/discounts?status=inactive&page=1&pageSize=10')
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    })
    expect(
      response.body.items.map((item: { combo: { id: string } }) => item.combo.id),
    ).toEqual(expect.arrayContaining([first.id, second.id]))
    expect(
      response.body.items.every(
        (item: { combo: { establishmentId: string } }) =>
          item.combo.establishmentId === '43000000-0000-0000-0000-000000000001',
      ),
    ).toBe(true)
  })

  it('enforces authentication, Manager authorization, and query validation', async () => {
    const anonymous = await request(fixture.app.getHttpServer()).get('/discounts')
    const operator = await request(fixture.app.getHttpServer())
      .get('/discounts')
      .set('Authorization', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get('/discounts')
      .set('Authorization', foreignManagerRequestAuthorization())
    const invalid = await request(fixture.app.getHttpServer())
      .get('/discounts?page=0')
      .set('Authorization', managerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(200)
    expect(invalid.status).toBe(422)
  })
})
