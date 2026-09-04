import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  EstablishmentFaker,
  UserFaker,
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
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { OnboardingConfirmationPreparedEvent } from '#identity/domain/events/onboarding-confirmation-prepared-event.ts'
import { CorrectIceCreamShopOnboardingEmailUseCase } from '#identity/use-cases/correct-ice-cream-shop-onboarding-email-use-case.ts'

describe('Correct Ice Cream Shop Onboarding Email Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let users: MockProxy<UsersRepository>
  let provider: MockProxy<OnboardingIdentityProvider>
  let tokens: MockProxy<OnboardingTokenProvider>
  let identifiers: MockProxy<OnboardingIdentifierProvider>
  let scope: IdentityDatabaseScope
  let useCase: CorrectIceCreamShopOnboardingEmailUseCase
  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    users = mock<UsersRepository>()
    provider = mock<OnboardingIdentityProvider>()
    tokens = mock<OnboardingTokenProvider>()
    identifiers = mock<OnboardingIdentifierProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: users,
    }
    database.run.mockImplementation((operation) => operation(scope))
    tokens.hash.mockReturnValue('hash')
    tokens.issue.mockReturnValue({ token: 'new-confirmation', hash: 'new-hash' })
    identifiers.generate.mockReturnValue('claim')
    provider.replacePendingIdentity.mockResolvedValue({
      authUser: { id: 'new-subject', email: 'new@example.com' },
      event: new OnboardingConfirmationPreparedEvent({
        userId: 'new-subject',
        email: 'new@example.com',
        name: 'Maria',
        actionUrl:
          'http://localhost/onboarding/confirm?confirmationToken=new-confirmation',
        expiresAt: '2026-01-08T00:00:00.000Z',
        occurredAt: '2026-01-02T00:00:00.000Z',
      }),
    })
    const attempt = UserRegistrationAttemptFaker.fake({
      tokenHash: 'hash',
      userId: 'old-subject',
      establishmentId: 'establishment-id',
    })
    attempts.findPendingByTokenHash.mockResolvedValue(attempt)
    attempts.findActiveByEmail.mockResolvedValue(undefined)
    users.findByEmail.mockResolvedValue(undefined)
    users.findById.mockResolvedValue(
      UserFaker.fake({
        id: 'old-subject',
        establishmentId: 'establishment-id',
        name: 'User',
      }),
    )
    users.add.mockImplementation(async (input) => ({ ...input }))
    attempts.replace.mockImplementation(async (id, changes) => ({
      ...attempt,
      id,
      ...changes,
    }))
    establishments.findById.mockResolvedValue(
      EstablishmentFaker.fake({ id: 'establishment-id', name: 'Scoops' }),
    )
    useCase = new CorrectIceCreamShopOnboardingEmailUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      tokens,
      identifiers,
      provider,
      mock<Broker>(),
    )
  })
  it('replaces the pending subject and preserves the original deadline', async () => {
    await expect(
      useCase.execute({
        continuationToken: 'continuation',
        email: 'NEW@example.com',
        password: 'password123',
        confirmationRedirectBaseUrl: 'http://localhost/onboarding/confirm',
      }),
    ).resolves.toMatchObject({ establishmentName: 'Scoops', email: 'new@example.com' })
    expect(provider.replacePendingIdentity).toHaveBeenCalledWith({
      providerSubject: 'old-subject',
      email: 'new@example.com',
      password: 'password123',
      name: 'User',
      confirmationRedirectTo:
        'http://localhost/onboarding/confirm?confirmationToken=new-confirmation',
    })
    expect(users.remove).toHaveBeenCalledWith('establishment-id', 'old-subject')
    expect(provider.removeIdentity).toHaveBeenCalledWith('old-subject')
  })
  it('does not mutate local onboarding when provider replacement fails', async () => {
    provider.replacePendingIdentity.mockRejectedValue(new Error('credentials'))
    await expect(
      useCase.execute({
        continuationToken: 'continuation',
        email: 'new@example.com',
        password: 'wrong',
        confirmationRedirectBaseUrl: 'http://localhost/onboarding/confirm',
      }),
    ).rejects.toThrow('credentials')
    expect(provider.replacePendingIdentity).toHaveBeenCalled()
    expect(users.add).not.toHaveBeenCalled()
  })
})
