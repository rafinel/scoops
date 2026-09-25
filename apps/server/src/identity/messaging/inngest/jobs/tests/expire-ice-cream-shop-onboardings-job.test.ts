import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { ExpireIceCreamShopOnboardingsJob } from '@/identity/messaging/inngest/jobs/expire-ice-cream-shop-onboardings-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

describe('Expire Ice Cream Shop Onboardings Job', () => {
  let fixture: IdentityModuleFixture
  let auth: BetterAuthFixture
  let recordJobRun: ReturnType<typeof vi.spyOn>
  let captureUnexpected: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    auth = new BetterAuthFixture()
    fixture = await IdentityModuleFixture.register(auth, {
      inngestJob: ExpireIceCreamShopOnboardingsJob,
    })
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
  })

  it('runs the registered cron through Inngest and records one safe terminal outcome', async () => {
    const datetimeProvider = fixture.get(DatetimeProvider)
    const expiredNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    vi.spyOn(datetimeProvider, 'now').mockReturnValue(expiredNow)
    const tokenProvider = fixture.get(IDENTITY_PROVIDERS.onboardingToken)
    const seeded = await fixture.seedPendingOnboarding(tokenProvider)

    const run = await fixture.invokeInngest()

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(ExpireIceCreamShopOnboardingsJob.ID)
    const database = fixture.get<IdentityDatabase>(IDENTITY_REPOSITORIES.database)
    await expect(
      database.run(({ registrationAttemptsRepository }) =>
        registrationAttemptsRepository.findById(seeded.registrationAttempt.id),
      ),
    ).resolves.toBeUndefined()
    await expect(
      database.run(({ establishmentsRepository }) =>
        establishmentsRepository.findById(seeded.establishment.id),
      ),
    ).resolves.toBeUndefined()
    expect(fixture.inngestFunctionOptions.triggers).toEqual([
      expect.objectContaining({ cron: '0 * * * *' }),
    ])
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: ExpireIceCreamShopOnboardingsJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(seeded.user.email)
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(seeded.user.id)
    expect(captureUnexpected).not.toHaveBeenCalled()
  })
})
