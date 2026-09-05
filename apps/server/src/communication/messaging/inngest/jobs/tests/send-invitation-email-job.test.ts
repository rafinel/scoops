import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { UserInvitationPreparedEvent } from '@scoops/core/identity/domain/events'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { SendInvitationEmailJob } from '@/communication/messaging/inngest/jobs/send-invitation-email-job'

describe('Send Invitation Email Job', () => {
  let fixture: CommunicationModuleFixture

  beforeAll(async () => {
    fixture = await CommunicationModuleFixture.register({
      inngestJob: SendInvitationEmailJob,
    })
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('registers the invitation email function with retries', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: SendInvitationEmailJob.ID,
      retries: 5,
      triggers: [expect.objectContaining({ name: UserInvitationPreparedEvent._NAME })],
    })
  })

  it('delivers the canonical invitation event through Inngest and Mailpit', async () => {
    const occurredAt = fixture.datetimeProvider.now()
    const expiresAt = new Date(occurredAt.getTime() + 60 * 60 * 1000)
    const event = new UserInvitationPreparedEvent({
      userId: fixture.idProvider.generate(),
      establishmentId: fixture.idProvider.generate(),
      email: `invite-${fixture.idProvider.generate()}@example.com`,
      name: 'Maria User',
      actionUrl: 'https://app.example.com/invitation?token=invitation-token',
      expiresAt: expiresAt.toISOString(),
      occurredAt: occurredAt.toISOString(),
      operation: 'initial',
    })

    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: event.name,
      data: event.payload,
    })
    const message = await fixture.waitForEmail(event.payload.email)

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(SendInvitationEmailJob.ID)
    expect(message.Subject).toBe('Convite para acessar o Scoops')
    expect(message.MessageID).toMatch(/@scoops\.local$/)
    expect(message.Text).toContain(event.payload.name)
    expect(message.HTML).toContain(event.payload.actionUrl)
    expect(message.Text).toContain(event.payload.expiresAt)
  })

  it('rejects malformed event data without delivering an email', async () => {
    const email = `invalid-${fixture.idProvider.generate()}@example.com`
    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: UserInvitationPreparedEvent._NAME,
      data: { userId: 'not-a-uuid', email },
    })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(await fixture.findEmail(email)).toBeUndefined()
  })
})
