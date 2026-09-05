import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { PasswordRecoveryPreparedEvent } from '@scoops/core/identity/domain/events'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { SendPasswordRecoveryEmailJob } from '@/communication/messaging/inngest/jobs/send-password-recovery-email-job'

describe('Send Password Recovery Email Job', () => {
  let fixture: CommunicationModuleFixture

  beforeAll(async () => {
    fixture = await CommunicationModuleFixture.register({
      inngestJob: SendPasswordRecoveryEmailJob,
    })
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('registers the password recovery function with retries', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: SendPasswordRecoveryEmailJob.ID,
      retries: 5,
      triggers: [expect.objectContaining({ name: PasswordRecoveryPreparedEvent._NAME })],
    })
  })

  it('delivers the canonical password recovery event through Inngest and Mailpit', async () => {
    const occurredAt = fixture.datetimeProvider.now()
    const expiresAt = new Date(occurredAt.getTime() + 60 * 60 * 1000)
    const event = new PasswordRecoveryPreparedEvent({
      userId: fixture.idProvider.generate(),
      email: `recovery-${fixture.idProvider.generate()}@example.com`,
      name: 'Maria User',
      actionUrl: 'https://app.example.com/reset-password?token=recovery-token',
      expiresAt: expiresAt.toISOString(),
      occurredAt: occurredAt.toISOString(),
    })

    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: event.name,
      data: event.payload,
    })
    const message = await fixture.waitForEmail(event.payload.email)

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(SendPasswordRecoveryEmailJob.ID)
    expect(message.Subject).toBe('Redefina sua senha no Scoops')
    expect(message.MessageID).toMatch(/@scoops\.local$/)
    expect(message.Text).toContain(event.payload.name)
    expect(message.HTML).toContain(event.payload.actionUrl)
    expect(message.Text).toContain(event.payload.expiresAt)
    expect(message.Text).toContain('Redefinir senha')
  })

  it('rejects malformed event data without delivering an email', async () => {
    const email = `invalid-${fixture.idProvider.generate()}@example.com`
    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: PasswordRecoveryPreparedEvent._NAME,
      data: { userId: 'not-a-uuid', email },
    })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(await fixture.findEmail(email)).toBeUndefined()
  })
})
