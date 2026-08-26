import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { comboCreate } from './combo-controller-test-helpers'

describe('Get Combo Controller [GET /discounts/:discountId]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns the persisted aggregate and derived detail values', async () => {
    const combo = await fixture.addCombo(comboCreate())

    const response = await request(fixture.app.getHttpServer())
      .get(`/discounts/${combo.id}`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.combo).toMatchObject({
      id: combo.id,
      establishmentId: combo.establishmentId,
      name: combo.name,
      type: 'combo',
      status: combo.status,
      fixedPrice: combo.fixedPrice,
      components: combo.components,
    })
    expect(response.body.combo.createdAt).toBe(combo.createdAt.toISOString())
    expect(response.body.components).toHaveLength(2)
  })

  it('hides foreign records and rejects malformed identifiers', async () => {
    const foreignCombo = await fixture.addCombo(
      comboCreate({
        establishmentId: '44000000-0000-0000-0000-000000000001',
        name: 'Foreign Combo',
      }),
    )
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/discounts/${foreignCombo.id}`)
      .set('Authorization', managerRequestAuthorization())
    const malformed = await request(fixture.app.getHttpServer())
      .get('/discounts/not-a-uuid')
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(foreign.status).toBe(404)
    expect(malformed.status).toBe(400)
  })
})
