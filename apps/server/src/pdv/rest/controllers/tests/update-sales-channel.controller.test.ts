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

describe('Update Sales Channel Controller [PATCH /sales-channels/:salesChannelId]', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates and persists normalized values, while enforcing conflicts and tenant access', async () => {
    const channel = await fixture.addSalesChannel(
      salesChannelCreate({ name: 'Old name' }),
    )
    const duplicate = await fixture.addSalesChannel(
      salesChannelCreate({ name: 'Other name' }),
    )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: '  New name  ', percentage: -5.25 })
    const conflict = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${duplicate.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'New name', percentage: 1 })
    const invalid = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'x', percentage: 1.001 })
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ name: 'Operator', percentage: 1 })
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/sales-channels/${channel.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ name: 'Foreign', percentage: 1 })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: channel.id,
      name: 'New name',
      percentage: -5.25,
    })
    expect(
      (await fixture.salesChannels.findById(channel.establishmentId, channel.id))?.name,
    ).toBe('New name')
    expect(conflict.status).toBe(409)
    expect(invalid.status).toBe(422)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
