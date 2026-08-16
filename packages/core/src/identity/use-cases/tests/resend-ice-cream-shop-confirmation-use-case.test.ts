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
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { ResendIceCreamShopConfirmationUseCase } from '#identity/use-cases/resend-ice-cream-shop-confirmation-use-case.ts'

describe('Resend Ice Cream Shop Confirmation Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let provider: MockProxy<OnboardingIdentityProvider>
  let tokenProvider: MockProxy<OnboardingTokenProvider>
  let scope: IdentityDatabaseScope
  let useCase: ResendIceCreamShopConfirmationUseCase
  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    provider = mock<OnboardingIdentityProvider>()
    tokenProvider = mock<OnboardingTokenProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: mock<UsersRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    tokenProvider.hash.mockReturnValue('hash')
    tokenProvider.issue.mockReturnValue({ token: 'new-confirmation', hash: 'new-hash' })
    useCase = new ResendIceCreamShopConfirmationUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      tokenProvider,
      provider,
    )
  })
  it('resends confirmation without changing the snapshot', async () => {
    const attempt = UserRegistrationAttemptFaker.fake({
      tokenHash: 'hash',
      establishmentId: 'establishment-id',
    })
    attempts.findPendingByTokenHash.mockResolvedValue(attempt)
    const establishment = EstablishmentFaker.fake({
      id: 'establishment-id',
      name: 'Scoops',
    })
    establishments.findById.mockResolvedValue(establishment)
    await expect(
      useCase.execute({
        continuationToken: 'continuation',
        confirmationRedirectBaseUrl: 'http://localhost/onboarding/confirm',
      }),
    ).resolves.toEqual({
      establishmentName: 'Scoops',
      managerName: attempt.name,
      email: attempt.email,
      expiresAt: attempt.expiresAt,
    })
    expect(provider.resendConfirmation).toHaveBeenCalledWith({
      email: attempt.email,
      confirmationRedirectTo:
        'http://localhost/onboarding/confirm?confirmationToken=new-confirmation',
    })
    expect(attempts.replace).toHaveBeenCalledWith(attempt.id, {
      confirmationTokenHash: 'new-hash',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
  })
})
