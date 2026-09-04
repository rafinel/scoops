import { EmailDeliveryUnavailableError } from '@scoops/core/communication/domain/errors'
import type { EmailProvider } from '@scoops/core/communication/interfaces'
import { describe, expect, it, vi } from 'vitest'
import type { InngestFunction } from 'inngest'

import {
  SendInvitationEmailJob,
  SendOnboardingConfirmationEmailJob,
  SendPasswordRecoveryEmailJob,
} from '@/communication/messaging/inngest/jobs'
import { SmtpEmailProvider } from '@/communication/provision/email/smtp/smtp-email-provider'
import { ResendEmailProvider } from '@/communication/provision/email/resend/resend-email-provider'

type JobHandler = (input: {
  event: { id: string; data: unknown }
  step: {
    run: (name: string, operation: () => Promise<unknown>) => Promise<unknown>
  }
}) => Promise<unknown>

type JobConstructor = new (inngest: unknown, provider: EmailProvider) => unknown

const events = {
  invitation: {
    userId: '55000000-0000-4000-8000-000000000001',
    establishmentId: '55000000-0000-4000-8000-000000000002',
    email: 'user@example.com',
    name: 'Ana',
    actionUrl: 'https://scoops.local/invitation?token=one',
    expiresAt: '2026-09-02T13:00:00.000Z',
    occurredAt: '2026-09-02T12:00:00.000Z',
    operation: 'initial' as const,
  },
  onboarding: {
    userId: '55000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    name: 'Ana',
    actionUrl: 'https://scoops.local/onboarding?token=one',
    expiresAt: '2026-09-02T13:00:00.000Z',
    occurredAt: '2026-09-02T12:00:00.000Z',
  },
  recovery: {
    userId: '55000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    name: 'Ana',
    actionUrl: 'https://scoops.local/recovery?token=one',
    expiresAt: '2026-09-02T13:00:00.000Z',
    occurredAt: '2026-09-02T12:00:00.000Z',
  },
}

function captureJob(Job: JobConstructor) {
  const provider: EmailProvider = {
    send: vi.fn().mockResolvedValue({ providerMessageId: 'provider-1' }),
  }
  return captureJobWithProvider(Job, provider)
}

function captureJobWithProvider(Job: JobConstructor, provider: EmailProvider) {
  const handlers: JobHandler[] = []
  const createFunction = vi.fn((_options: unknown, handler: JobHandler) => {
    handlers.push(handler)
    return {} as InngestFunction.Like
  })

  new Job({ createFunction } as unknown, provider)

  return { handlers, createFunction, provider }
}

describe('Communication identity email jobs', () => {
  it('registers three validated functions with stable durable send steps', async () => {
    const jobs = [
      [SendInvitationEmailJob, events.invitation],
      [SendOnboardingConfirmationEmailJob, events.onboarding],
      [SendPasswordRecoveryEmailJob, events.recovery],
    ] as const

    for (const [Job, data] of jobs) {
      const captured = captureJob(Job)
      expect(captured.createFunction).toHaveBeenCalledWith(
        expect.objectContaining({ retries: 5 }),
        expect.any(Function),
      )
      const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
        operation(),
      )

      await captured.handlers[0]({
        event: { id: 'outbox-event-1', data },
        step: { run: stepRun },
      })

      expect(stepRun).toHaveBeenCalledWith(
        expect.stringContaining('send-'),
        expect.any(Function),
      )
      expect(captured.provider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'outbox-event-1',
          to: 'user@example.com',
        }),
      )
    }
  })

  it('leaves provider failures thrown so Inngest can retry the durable step', async () => {
    const captured = captureJob(SendInvitationEmailJob)
    const provider = captured.provider.send as ReturnType<typeof vi.fn>
    provider.mockRejectedValueOnce(new Error('temporary provider failure'))
    const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
      operation(),
    )

    await expect(
      captured.handlers[0]({
        event: { id: 'outbox-event-2', data: events.invitation },
        step: { run: stepRun },
      }),
    ).rejects.toThrow('temporary provider failure')
  })

  it('runs the Communication job through the SMTP adapter and preserves its delivery id', async () => {
    const sendMail = vi
      .fn()
      .mockResolvedValue({ messageId: '<smtp-message@scoops.local>' })
    const provider = new SmtpEmailProvider(
      {
        get: (key: string) => (key === 'EMAIL_FROM' ? 'sender@scoops.local' : 'mailpit'),
      } as never,
      { sendMail },
    )
    const captured = captureJobWithProvider(SendInvitationEmailJob, provider)
    const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
      operation(),
    )

    await captured.handlers[0]({
      event: { id: 'smtp-event-1', data: events.invitation },
      step: { run: stepRun },
    })

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sender@scoops.local',
        to: 'user@example.com',
        messageId: '<smtp-event-1@scoops.local>',
      }),
    )
  })

  it('maps SMTP provider failures to the safe retryable delivery error', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('smtp credentials leaked'))
    const provider = new SmtpEmailProvider(
      {
        get: (key: string) => (key === 'EMAIL_FROM' ? 'sender@scoops.local' : 'mailpit'),
      } as never,
      { sendMail },
    )
    const captured = captureJobWithProvider(SendInvitationEmailJob, provider)
    const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
      operation(),
    )

    await expect(
      captured.handlers[0]({
        event: { id: 'smtp-failure-event-1', data: events.invitation },
        step: { run: stepRun },
      }),
    ).rejects.toBeInstanceOf(EmailDeliveryUnavailableError)
    await expect(
      captured.handlers[0]({
        event: { id: 'smtp-failure-event-2', data: events.invitation },
        step: { run: stepRun },
      }),
    ).rejects.toMatchObject({ message: 'Email delivery is unavailable' })

    expect(sendMail).toHaveBeenCalledTimes(2)
    expect(stepRun).toHaveBeenCalledTimes(2)
  })

  it('runs the Communication job through the Resend adapter and maps provider failures safely', async () => {
    const resendSend = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 'resend-message-1' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'provider secret details' },
      })
    const provider = new ResendEmailProvider(
      {
        get: (key: string) => (key === 'EMAIL_FROM' ? 'sender@scoops.local' : 'unused'),
      } as never,
      { emails: { send: resendSend } },
    )
    const captured = captureJobWithProvider(SendPasswordRecoveryEmailJob, provider)
    const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
      operation(),
    )

    await captured.handlers[0]({
      event: { id: 'resend-event-1', data: events.recovery },
      step: { run: stepRun },
    })
    await expect(
      captured.handlers[0]({
        event: { id: 'resend-event-2', data: events.recovery },
        step: { run: stepRun },
      }),
    ).rejects.toBeInstanceOf(EmailDeliveryUnavailableError)
    await expect(
      captured.handlers[0]({
        event: { id: 'resend-event-3', data: events.recovery },
        step: { run: stepRun },
      }),
    ).rejects.toMatchObject({ message: 'Email delivery is unavailable' })

    expect(resendSend).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: ['user@example.com'] }),
      { idempotencyKey: 'resend-event-1' },
    )
    expect(resendSend).toHaveBeenCalledTimes(3)
    expect(stepRun).toHaveBeenCalledTimes(3)
  })

  it('rejects missing event ids and malformed payloads at every email consumer boundary', async () => {
    const jobs = [
      SendInvitationEmailJob,
      SendOnboardingConfirmationEmailJob,
      SendPasswordRecoveryEmailJob,
    ] as const

    for (const Job of jobs) {
      const captured = captureJob(Job)
      const stepRun = vi.fn(async (_name: string, operation: () => Promise<unknown>) =>
        operation(),
      )
      await expect(
        captured.handlers[0]({
          event: { id: undefined, data: events.invitation },
          step: { run: stepRun },
        }),
      ).rejects.toThrow('Communication event id is required')
      await expect(
        captured.handlers[0]({
          event: { id: 'invalid-event', data: { invalid: true } },
          step: { run: stepRun },
        }),
      ).rejects.toThrow()
      expect(stepRun).not.toHaveBeenCalled()
    }
  })
})
