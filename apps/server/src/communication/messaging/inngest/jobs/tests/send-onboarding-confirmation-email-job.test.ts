import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { OnboardingConfirmationPreparedEvent } from '@scoops/core/identity/domain/events'
import type { Telemetry } from '@scoops/core/shared/interfaces'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { SendOnboardingConfirmationEmailJob } from '@/communication/messaging/inngest/jobs/send-onboarding-confirmation-email-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

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
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    const recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    const captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
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
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: SendOnboardingConfirmationEmailJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(event.payload.email)
    expect(captureUnexpected).not.toHaveBeenCalled()
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
