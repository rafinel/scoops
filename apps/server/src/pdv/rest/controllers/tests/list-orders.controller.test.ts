import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import {
  PdvModuleFixture,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  preparePdvFixture,
  resetPdvFixture,
} from '@/pdv/fixtures/pdv-module-fixture'

describe('List Orders Controller [GET /orders]', () => {
  let fixture: PdvModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await preparePdvFixture()))
  beforeEach(async () => resetPdvFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('lists tenant orders with search, channel, status and date filters', async () => {
    const channel = await fixture.addSalesChannel({
      establishmentId: PdvModuleFixture.accounts.establishmentId,
      name: 'Delivery',
      percentage: 10,
      status: 'active',
    })
    const channeled = await fixture.registerPortionOrder({
      authorization: managerRequestAuthorization(),
      productName: 'Chocolate Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000101',
      channelId: channel.id,
    })
    const noChannel = await fixture.registerPortionOrder({
      authorization: operatorRequestAuthorization(),
      productName: 'Vanilla Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000102',
    })
    await fixture.registerPortionOrder({
      authorization: foreignManagerRequestAuthorization(),
      establishmentId: PdvModuleFixture.accounts.foreignEstablishmentId,
      productName: 'Foreign Snapshot',
      idempotencyKey: '55000000-0000-4000-8000-000000000103',
    })

    const search = await request(fixture.app.getHttpServer())
      .get(
        '/orders?search=Chocolate&createdFrom=2026-01-01T00:00:00.000Z&createdTo=2027-01-01T00:00:00.000Z&status=registered&page=1&pageSize=6',
      )
      .set('Authorization', managerRequestAuthorization())
    const channelFilter = await request(fixture.app.getHttpServer())
      .get(`/orders?channelId=${channel.id}`)
      .set('Authorization', managerRequestAuthorization())
    const noChannelFilter = await request(fixture.app.getHttpServer())
      .get('/orders?channelId=none')
      .set('Authorization', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .get('/orders')
      .set('Authorization', operatorRequestAuthorization())

    expect(search.status).toBe(200)
    expect(search.body).toMatchObject({ page: 1, pageSize: 6, total: 1, totalPages: 1 })
    expect(search.body.items[0]).toMatchObject({
      id: channeled.order.id,
      createdByName: 'Maria Manager',
      status: 'registered',
    })
    expect(channelFilter.body.items.map((item: { id: string }) => item.id)).toEqual([
      channeled.order.id,
    ])
    expect(noChannelFilter.body.items.map((item: { id: string }) => item.id)).toEqual([
      noChannel.order.id,
    ])
    expect(operator.body.total).toBe(2)
    expect(operator.body.items[0].createdAt).toMatch(/Z$/)
  })

  it('rejects malformed queries and unauthenticated requests', async () => {
    const malformed = await request(fixture.app.getHttpServer())
      .get('/orders?createdFrom=2026-01-01T00:00:00.000Z')
      .set('Authorization', managerRequestAuthorization())
    const anonymous = await request(fixture.app.getHttpServer()).get('/orders')
    const foreign = await request(fixture.app.getHttpServer())
      .get('/orders')
      .set('Authorization', foreignManagerRequestAuthorization())

    expect(malformed.status).toBe(422)
    expect(malformed.body).not.toHaveProperty('items')
    expect(anonymous.status).toBe(401)
    expect(foreign.status).toBe(200)
    expect(foreign.body.items).toEqual([])
  })
})
