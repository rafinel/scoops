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

describe('List Active Sales Channels Controller [GET /sales-channels/active]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns active channels to managers and operators within their tenant', async () => {
    await fixture.addSalesChannel({
      establishmentId: '43000000-0000-0000-0000-000000000001',
      name: 'Active',
      percentage: 1,
      status: 'active',
    })
    await fixture.addSalesChannel({
      establishmentId: '43000000-0000-0000-0000-000000000001',
      name: 'Inactive',
      percentage: 2,
      status: 'inactive',
    })
    await fixture.addSalesChannel({
      establishmentId: '44000000-0000-0000-0000-000000000001',
      name: 'Foreign Active',
      percentage: 3,
      status: 'active',
    })

    const manager = await request(fixture.app.getHttpServer())
      .get('/sales-channels/active')
      .set('Authorization', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .get('/sales-channels/active')
      .set('Authorization', operatorRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      '/sales-channels/active',
    )

    expect(manager.status).toBe(200)
    expect(operator.status).toBe(200)
    expect(manager.body).toHaveLength(1)
    expect(manager.body[0]).toMatchObject({ name: 'Active', status: 'active' })
    expect(operator.body).toEqual(manager.body)
    expect(anonymous.status).toBe(401)
  })
})
