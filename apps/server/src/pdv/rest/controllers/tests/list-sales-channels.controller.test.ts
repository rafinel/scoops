import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
  salesChannelCreate,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('List Sales Channels Controller [GET /sales-channels]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('lists only the current tenant for managers and denies operators', async () => {
    const first = await fixture.addSalesChannel(salesChannelCreate({ name: 'Zulu' }))
    const second = await fixture.addSalesChannel(salesChannelCreate({ name: 'Alpha' }))
    await fixture.addSalesChannel(
      salesChannelCreate({
        establishmentId: '44000000-0000-0000-0000-000000000001',
        name: 'Foreign',
      }),
    )

    const manager = await request(fixture.app.getHttpServer())
      .get('/sales-channels')
      .set('Authorization', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .get('/sales-channels')
      .set('Authorization', operatorRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get('/sales-channels')

    expect(manager.status).toBe(200)
    expect(manager.body.map((channel: { id: string }) => channel.id)).toEqual([
      second.id,
      first.id,
    ])
    expect(
      manager.body.every(
        (channel: { establishmentId: string }) =>
          channel.establishmentId === '43000000-0000-0000-0000-000000000001',
      ),
    ).toBe(true)
    expect(operator.status).toBe(403)
    expect(anonymous.status).toBe(401)
  })
})
