import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { RetryAfterError } from 'inngest'

import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { UserInvitationPreparedEvent } from '@scoops/core/identity/domain/events'
import type { Telemetry } from '@scoops/core/shared/interfaces'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'
import { SendInvitationEmailJob } from '@/communication/messaging/inngest/jobs/send-invitation-email-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

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
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    const recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    const captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
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
    expect(message.Text).toMatch(
      /Este link expira em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}\./,
    )
    expect(message.Text).not.toContain(event.payload.expiresAt)
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: SendInvitationEmailJob.ID,
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
      name: UserInvitationPreparedEvent._NAME,
      data: { userId: 'not-a-uuid', email },
    })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(await fixture.findEmail(email)).toBeUndefined()
  })

  it('records only one terminal failure after retries without exporting event data', async () => {
    const email = `retry-${fixture.idProvider.generate()}@example.com`
    const send = vi
      .fn<EmailProvider['send']>()
      .mockRejectedValue(new RetryAfterError('Private provider detail', 10))
    const failureFixture = await CommunicationModuleFixture.register({
      inngestJob: SendInvitationEmailJob,
      emailProvider: { send },
      timeoutMs: 90_000,
    })

    try {
      const telemetry = failureFixture.get<Telemetry>(TELEMETRY)
      const recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
      const captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
      const event = new UserInvitationPreparedEvent({
        userId: failureFixture.idProvider.generate(),
        establishmentId: CommunicationModuleFixture.accounts.establishmentId,
        email,
        name: 'Private User Name',
        actionUrl: `https://app.example.com/invitation?token=${failureFixture.idProvider.generate()}`,
        expiresAt: new Date(
          failureFixture.datetimeProvider.now().getTime() + 60 * 60 * 1000,
        ).toISOString(),
        occurredAt: failureFixture.datetimeProvider.now().toISOString(),
        operation: 'initial',
      })

      const run = await failureFixture.runInngest({
        name: event.name,
        data: event.payload,
      })

      expect(run.status.toLowerCase()).toBe('failed')
      expect(send).toHaveBeenCalledTimes(6)
      expect(recordJobRun).toHaveBeenCalledTimes(1)
      expect(recordJobRun).toHaveBeenCalledWith({
        functionId: SendInvitationEmailJob.ID,
        outcome: 'failure',
        durationMs: expect.any(Number),
      })
      expect(captureUnexpected).toHaveBeenCalledTimes(1)
      expect(captureUnexpected.mock.calls[0]?.[1]).toEqual({
        functionId: SendInvitationEmailJob.ID,
        outcome: 'failure',
        durationMs: expect.any(Number),
        errorClass: 'Error',
      })
      const safeTelemetry = JSON.stringify([
        recordJobRun.mock.calls,
        captureUnexpected.mock.calls.map(([, safeContext]) => safeContext),
      ])
      expect(safeTelemetry).not.toContain(email)
      expect(safeTelemetry).not.toContain('Private User Name')
      expect(safeTelemetry).not.toContain(event.payload.actionUrl)
    } finally {
      await failureFixture.close()
    }
  }, 120_000)
})
