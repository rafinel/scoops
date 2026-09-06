import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'

import {
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  notificationInput,
  prepareCommunicationFixture,
  resetCommunicationFixture,
} from './communication-controller-test-helpers'

describe('Mark Notifications Read Controller [PATCH /notifications/read]', () => {
  let fixture: CommunicationModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareCommunicationFixture()))
  beforeEach(async () => resetCommunicationFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('marks only owned rows, coalesces duplicates, and returns a neutral owned result', async () => {
    await fixture.seedNotifications([
      notificationInput({ sourceEventId: 'source-own-1' }),
      notificationInput({ sourceEventId: 'source-own-2' }),
      notificationInput({
        sourceEventId: 'source-foreign',
        establishmentId: CommunicationModuleFixture.accounts.foreignEstablishmentId,
        recipientUserId: CommunicationModuleFixture.accounts.foreignManagerId,
      }),
    ])
    const managerPage = await fixture.notificationsRepository.findPage({
      establishmentId: CommunicationModuleFixture.accounts.establishmentId,
      recipientUserId: CommunicationModuleFixture.accounts.managerId,
      limit: 50,
    })
    const foreignPage = await fixture.notificationsRepository.findPage({
      establishmentId: CommunicationModuleFixture.accounts.foreignEstablishmentId,
      recipientUserId: CommunicationModuleFixture.accounts.foreignManagerId,
      limit: 50,
    })
    const ownId = managerPage.items.find(
      (item) => item.sourceEventId === 'source-own-1',
    )?.id
    const otherOwnId = managerPage.items.find(
      (item) => item.sourceEventId === 'source-own-2',
    )?.id
    const foreignId = foreignPage.items[0]?.id
    if (!ownId || !otherOwnId || !foreignId)
      throw new Error('Notification fixtures were not seeded.')

    const response = await request(fixture.app.getHttpServer())
      .patch('/notifications/read')
      .set('Cookie', managerRequestAuthorization())
      .send({ notificationIds: [ownId, ownId, foreignId] })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ notificationIds: [ownId] })
    const after = await fixture.notificationsRepository.findPage({
      establishmentId: CommunicationModuleFixture.accounts.establishmentId,
      recipientUserId: CommunicationModuleFixture.accounts.managerId,
      limit: 50,
    })
    expect(after.items.find((item) => item.id === ownId)?.readAt).toBeInstanceOf(Date)
    expect(after.items.find((item) => item.id === otherOwnId)?.readAt).toBeUndefined()
    const foreignAfter = await fixture.notificationsRepository.findPage({
      establishmentId: CommunicationModuleFixture.accounts.foreignEstablishmentId,
      recipientUserId: CommunicationModuleFixture.accounts.foreignManagerId,
      limit: 50,
    })
    expect(foreignAfter.items[0]?.readAt).toBeUndefined()
  })

  it('rejects invalid bodies and anonymous access', async () => {
    const invalid = await request(fixture.app.getHttpServer())
      .patch('/notifications/read')
      .set('Cookie', managerRequestAuthorization())
      .send({ notificationIds: [] })
    expect(invalid.status).toBe(422)

    const anonymous = await request(fixture.app.getHttpServer())
      .patch('/notifications/read')
      .send({ notificationIds: ['55000000-0000-4000-8000-000000000004'] })
    expect(anonymous.status).toBe(401)

    const foreign = await request(fixture.app.getHttpServer())
      .patch('/notifications/read')
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ notificationIds: ['55000000-0000-4000-8000-000000000004'] })
    expect(foreign.status).toBe(200)
    expect(foreign.body).toEqual({ notificationIds: [] })
  })
})
