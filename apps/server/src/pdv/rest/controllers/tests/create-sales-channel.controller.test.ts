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

describe('Create Sales Channel Controller [POST /sales-channels]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('creates a channel, validates constraints, and enforces tenant/profile access', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: '  Delivery próprio  ', percentage: 12.5, status: 'active' })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      establishmentId: '43000000-0000-0000-0000-000000000001',
      name: 'Delivery próprio',
      percentage: 12.5,
      status: 'active',
    })
    expect(
      await fixture.salesChannels.findMany('43000000-0000-0000-0000-000000000001'),
    ).toHaveLength(1)

    const anonymous = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .send({
        name: 'Anonymous',
        percentage: 1,
        status: 'active',
      })
    const operator = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .set('Authorization', operatorRequestAuthorization())
      .send({ name: 'Operator', percentage: 1, status: 'active' })
    const invalid = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .set('Authorization', managerRequestAuthorization())
      .send({ name: 'x', percentage: 1.001, status: 'active' })
    const foreign = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .set('Authorization', foreignManagerRequestAuthorization())
      .send({ name: 'Foreign', percentage: 1, status: 'active' })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(invalid.status).toBe(422)
    expect(foreign.status).toBe(201)
  })

  it('resolves a normalized-name race with one success and one conflict per tenant', async () => {
    const responses = await Promise.all(
      [1, 2].map((index) =>
        request(fixture.app.getHttpServer())
          .post('/sales-channels')
          .set('Authorization', managerRequestAuthorization())
          .send({
            name: `  Marketplace ${index === 1 ? 'A' : 'A'}  `,
            percentage: 2.5,
            status: 'active',
          }),
      ),
    )

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])

    const foreign = await request(fixture.app.getHttpServer())
      .post('/sales-channels')
      .set('Authorization', foreignManagerRequestAuthorization())
      .send({ name: 'Marketplace A', percentage: 2.5, status: 'active' })
    expect(foreign.status).toBe(201)
  })
})
