import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'
import {
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
  salesChannelCreate,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('Delete Sales Channel Controller [DELETE /sales-channels/:salesChannelId]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('deletes the channel without requiring snapshot or order coupling', async () => {
    const channel = await fixture.addSalesChannel(salesChannelCreate())
    const response = await request(fixture.app.getHttpServer())
      .delete(`/sales-channels/${channel.id}`)
      .set('Cookie', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/sales-channels/${channel.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/sales-channels/${channel.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).delete(
      `/sales-channels/${channel.id}`,
    )

    expect(response.status).toBe(204)
    expect(response.body).toEqual({})
    expect(
      await fixture.salesChannels.findById(channel.establishmentId, channel.id),
    ).toBeUndefined()
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(anonymous.status).toBe(401)
  })
})
