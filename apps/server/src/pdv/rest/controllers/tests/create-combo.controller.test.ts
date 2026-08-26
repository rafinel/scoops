import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

import { comboCreate } from './combo-controller-test-helpers'

describe('Create Combo Controller [POST /discounts]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('creates an inactive Combo, persists it, and publishes its domain event', async () => {
    const { establishmentId: _establishmentId, ...body } = comboCreate()

    const response = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Authorization', managerRequestAuthorization())
      .send(body)

    expect(response.status).toBe(201)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.combo).toMatchObject({
      establishmentId: '43000000-0000-0000-0000-000000000001',
      name: 'Chocolate Combo',
      status: 'inactive',
      fixedPrice: 15,
      components: body.components,
    })
    const persisted = await fixture.discounts.findById(
      '43000000-0000-0000-0000-000000000001',
      response.body.combo.id,
    )
    expect(persisted?.name).toBe('Chocolate Combo')
    expect(fixture.broker.events.at(-1)?.name).toBe('pdv/discount.created')
  })

  it('rejects malformed bodies and non-Manager callers without persistence', async () => {
    const malformed = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '', status: 'inactive', fixedPrice: 1, components: [] })
    const operator = await request(fixture.app.getHttpServer())
      .post('/discounts')
      .set('Authorization', operatorRequestAuthorization())
      .send(comboCreate())

    expect(malformed.status).toBe(422)
    expect(operator.status).toBe(403)
    await expect(
      fixture.discounts.findPage({
        establishmentId: '43000000-0000-0000-0000-000000000001',
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toMatchObject({ total: 0 })
  })
})
