import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'

describe('List Notifications Controller [GET /notifications]', () => {
  let fixture: CommunicationModuleFixture
  let auth: Awaited<ReturnType<typeof CommunicationModuleFixture.prepare>>['auth']

  beforeAll(async () => ({ fixture, auth } = await CommunicationModuleFixture.prepare()))
  beforeEach(async () => fixture.reset(auth))
  afterAll(async () => fixture?.close())

  it('lists only the authenticated recipient with stable descending cursor pagination', async () => {
    const establishmentId = CommunicationModuleFixture.accounts.establishmentId
    const managerId = CommunicationModuleFixture.accounts.managerId
    await fixture.seedNotifications([
      CommunicationModuleFixture.notificationInput({
        sourceEventId: 'source-old',
        occurredAt: new Date('2026-09-05T10:00:00.000Z'),
      }),
      CommunicationModuleFixture.notificationInput({
        sourceEventId: 'source-new',
        occurredAt: new Date('2026-09-05T12:00:00.000Z'),
      }),
      CommunicationModuleFixture.notificationInput({
        sourceEventId: 'source-operator',
        recipientUserId: CommunicationModuleFixture.accounts.operatorId,
      }),
      CommunicationModuleFixture.notificationInput({
        sourceEventId: 'source-foreign',
        establishmentId: CommunicationModuleFixture.accounts.foreignEstablishmentId,
        recipientUserId: CommunicationModuleFixture.accounts.foreignManagerId,
      }),
    ])

    const first = await request(fixture.app.getHttpServer())
      .get('/notifications?limit=1')
      .set('Cookie', fixture.managerRequestAuthorization())

    expect(first.status).toBe(200)
    expect(first.body.items).toHaveLength(1)
    expect(first.body.items[0]).toMatchObject({
      establishmentId,
      recipientUserId: managerId,
      sourceEventId: 'source-new',
    })
    expect(first.body.unreadCount).toBe(2)
    expect(first.body.nextCursor).toEqual({
      occurredAt: '2026-09-05T12:00:00.000Z',
      id: expect.any(String),
    })

    const cursor = first.body.nextCursor
    const second = await request(fixture.app.getHttpServer())
      .get(
        `/notifications?limit=1&cursorOccurredAt=${encodeURIComponent(cursor.occurredAt)}&cursorId=${cursor.id}`,
      )
      .set('Cookie', fixture.managerRequestAuthorization())

    expect(second.status).toBe(200)
    expect(second.body.items).toHaveLength(1)
    expect(second.body.items[0].sourceEventId).toBe('source-old')
    expect(second.body.nextCursor).toBeUndefined()
  })

  it('accepts inclusive bounds and rejects incomplete cursor or anonymous access', async () => {
    await fixture.seedNotifications([
      CommunicationModuleFixture.notificationInput({ sourceEventId: 'source-bounded' }),
    ])

    const bounded = await request(fixture.app.getHttpServer())
      .get(
        '/notifications?occurredFrom=2026-09-05T12:00:00.000Z&occurredTo=2026-09-05T12:00:00.000Z',
      )
      .set('Cookie', fixture.managerRequestAuthorization())
    expect(bounded.status).toBe(200)
    expect(bounded.body.items).toHaveLength(1)

    const invalidCursor = await request(fixture.app.getHttpServer())
      .get('/notifications?cursorId=55000000-0000-4000-8000-000000000004')
      .set('Cookie', fixture.managerRequestAuthorization())
    expect(invalidCursor.status).toBe(422)

    const anonymous = await request(fixture.app.getHttpServer()).get('/notifications')
    expect(anonymous.status).toBe(401)
  })

  it('keeps duplicate source delivery idempotent at the database boundary', async () => {
    const duplicate = CommunicationModuleFixture.notificationInput({
      sourceEventId: 'seed/runtime/duplicate-delivery',
    })
    await fixture.seedNotifications([duplicate, { ...duplicate }])

    const response = await request(fixture.app.getHttpServer())
      .get('/notifications')
      .set('Cookie', fixture.managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].sourceEventId).toBe('seed/runtime/duplicate-delivery')
    expect(response.body.unreadCount).toBe(1)
  })
})
