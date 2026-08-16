import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  EstablishmentFaker,
  UserRegistrationAttemptFaker,
} from '#identity/domain/entities/fakers/index.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { GetIceCreamShopOnboardingUseCase } from '#identity/use-cases/get-ice-cream-shop-onboarding-use-case.ts'

describe('Get Ice Cream Shop Onboarding Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let tokenProvider: MockProxy<OnboardingTokenProvider>
  let scope: IdentityDatabaseScope
  let useCase: GetIceCreamShopOnboardingUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    tokenProvider = mock<OnboardingTokenProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: mock<UsersRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    tokenProvider.hash.mockReturnValue('hash')
    useCase = new GetIceCreamShopOnboardingUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      tokenProvider,
    )
  })

  it('returns the safe pending snapshot', async () => {
    const attempt = UserRegistrationAttemptFaker.fake({
      tokenHash: 'hash',
      establishmentId: 'establishment-id',
    })
    attempts.findPendingByTokenHash.mockResolvedValue(attempt)
    establishments.findById.mockResolvedValue(
      EstablishmentFaker.fake({ id: 'establishment-id', name: 'Scoops' }),
    )
    await expect(useCase.execute({ continuationToken: 'continuation' })).resolves.toEqual(
      {
        establishmentName: 'Scoops',
        managerName: attempt.name,
        email: attempt.email,
        expiresAt: attempt.expiresAt,
      },
    )
  })

  it('rejects an expired attempt', async () => {
    attempts.findPendingByTokenHash.mockResolvedValue(
      UserRegistrationAttemptFaker.fake({
        tokenHash: 'hash',
        expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    )
    await expect(useCase.execute({ continuationToken: 'continuation' })).rejects.toThrow(
      'expired',
    )
  })
})
