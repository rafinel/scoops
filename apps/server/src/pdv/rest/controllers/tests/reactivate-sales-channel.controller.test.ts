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
  salesChannelCreate,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Reactivate Sales Channel Controller [PATCH /sales-channels/:salesChannelId/reactivate]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('reactivates an inactive channel and preserves profile and tenant boundaries', async () => {
    const channel = await fixture.addSalesChannel(
      salesChannelCreate({ status: 'inactive' }),
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}/reactivate`)
      .set('Authorization', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}/reactivate`)
      .set('Authorization', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}/reactivate`)
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: channel.id, status: 'active' })
    expect(
      (await fixture.salesChannels.findActive(channel.establishmentId)).map(
        ({ id }) => id,
      ),
    ).toEqual([channel.id])
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
