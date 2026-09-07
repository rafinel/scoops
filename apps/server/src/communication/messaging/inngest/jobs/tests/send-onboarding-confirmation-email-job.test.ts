import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { OnboardingConfirmationPreparedEvent } from '@scoops/core/identity/domain/events'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { SendOnboardingConfirmationEmailJob } from '@/communication/messaging/inngest/jobs/send-onboarding-confirmation-email-job'

describe('Send Onboarding Confirmation Email Job', () => {
  let fixture: CommunicationModuleFixture

  beforeAll(async () => {
    fixture = await CommunicationModuleFixture.register({
      inngestJob: SendOnboardingConfirmationEmailJob,
    })
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('registers the onboarding confirmation function with retries', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: SendOnboardingConfirmationEmailJob.ID,
      retries: 5,
      triggers: [
        expect.objectContaining({ name: OnboardingConfirmationPreparedEvent._NAME }),
      ],
    })
  })

  it('delivers the canonical onboarding event through Inngest and Mailpit', async () => {
    const occurredAt = fixture.datetimeProvider.now()
    const expiresAt = new Date(occurredAt.getTime() + 60 * 60 * 1000)
    const event = new OnboardingConfirmationPreparedEvent({
      userId: fixture.idProvider.generate(),
      email: `onboarding-${fixture.idProvider.generate()}@example.com`,
      name: 'Maria User',
      actionUrl: 'https://app.example.com/onboarding/confirm?token=confirmation-token',
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
    expect(run.function?.id).toBe(SendOnboardingConfirmationEmailJob.ID)
    expect(message.Subject).toBe('Confirme seu cadastro no Scoops')
    expect(message.MessageID).toMatch(/@scoops\.local$/)
    expect(message.Text).toContain(event.payload.name)
    expect(message.HTML).toContain(event.payload.actionUrl)
    expect(message.Text).toContain(event.payload.expiresAt)
    expect(message.Text).toContain('Confirmar cadastro')
  })

  it('rejects malformed event data without delivering an email', async () => {
    const email = `invalid-${fixture.idProvider.generate()}@example.com`
    const run = await fixture.runInngest({
      id: fixture.idProvider.generate(),
      name: OnboardingConfirmationPreparedEvent._NAME,
      data: { userId: 'not-a-uuid', email },
    })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(await fixture.findEmail(email)).toBeUndefined()
  })
})
