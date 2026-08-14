import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import { fakeUserRegistrationAttempt } from '#identity/domain/entities/fakers/index.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { ExpireIceCreamShopOnboardingsUseCase } from '#identity/use-cases/expire-ice-cream-shop-onboardings-use-case.ts'

describe('Expire Ice Cream Shop Onboardings Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let provider: MockProxy<OnboardingIdentityProvider>
  let datetime: MockProxy<DatetimeProvider>
  let scope: IdentityDatabaseScope
  let useCase: ExpireIceCreamShopOnboardingsUseCase
  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    provider = mock<OnboardingIdentityProvider>()
    datetime = mock<DatetimeProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: mock<UsersRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetime.now.mockReturnValue(new Date('2026-01-09T00:00:00.000Z'))
    useCase = new ExpireIceCreamShopOnboardingsUseCase(database, datetime, provider)
  })
  it('claims and removes expired identities and establishment', async () => {
    const claim = fakeUserRegistrationAttempt({
      status: RegistrationAttemptStatus.Expired,
      userId: 'subject',
      establishmentId: 'establishment',
    })
    attempts.claimForCleanup.mockResolvedValue([claim])
    provider.removeIdentity.mockResolvedValue()
    establishments.remove.mockResolvedValue()
    await expect(useCase.execute({ limit: 100, claimToken: 'claim' })).resolves.toEqual({
      expired: 1,
      removed: 1,
      failed: 0,
    })
    expect(provider.removeIdentity).toHaveBeenCalledWith('subject')
    expect(establishments.remove).toHaveBeenCalledWith('establishment')
  })
})
