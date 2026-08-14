import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  fakeEstablishment,
  fakeUser,
  fakeUserRegistrationAttempt,
} from '#identity/domain/entities/fakers/index.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { ConfirmIceCreamShopOnboardingUseCase } from '#identity/use-cases/confirm-ice-cream-shop-onboarding-use-case.ts'

describe('Confirm Ice Cream Shop Onboarding Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let users: MockProxy<UsersRepository>
  let tokens: MockProxy<OnboardingTokenProvider>
  let scope: IdentityDatabaseScope
  let useCase: ConfirmIceCreamShopOnboardingUseCase
  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    users = mock<UsersRepository>()
    tokens = mock<OnboardingTokenProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: users,
    }
    database.run.mockImplementation((operation) => operation(scope))
    tokens.hash.mockReturnValue('confirmation-hash')
    const user = fakeUser({
      id: 'subject',
      status: 'pending',
      establishmentId: 'establishment-id',
      email: 'maria@example.com',
    })
    const attempt = fakeUserRegistrationAttempt({
      userId: 'subject',
      establishmentId: 'establishment-id',
      email: 'maria@example.com',
      confirmationTokenHash: 'confirmation-hash',
    })
    users.findByProviderSubject.mockResolvedValue(user)
    attempts.findByUserId.mockResolvedValue(attempt)
    establishments.findById.mockResolvedValue(
      fakeEstablishment({ id: 'establishment-id', status: 'pending' }),
    )
    establishments.replace.mockImplementation(async (id, changes) => ({
      ...fakeEstablishment({ id }),
      ...changes,
    }))
    users.replace.mockImplementation(async (establishmentId, id, changes) => ({
      ...user,
      establishmentId,
      id,
      ...changes,
    }))
    attempts.replace.mockImplementation(async (id, changes) => ({
      ...attempt,
      id,
      ...changes,
    }))
    useCase = new ConfirmIceCreamShopOnboardingUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      tokens,
    )
  })
  it('activates the establishment, Manager and attempt in one database callback', async () => {
    await expect(
      useCase.execute({
        providerSubject: 'subject',
        verifiedEmail: 'MARIA@EXAMPLE.COM',
        confirmationToken: 'confirmation',
      }),
    ).resolves.toBeUndefined()
    expect(establishments.replace).toHaveBeenCalled()
    expect(users.replace).toHaveBeenCalledWith(
      'establishment-id',
      'subject',
      expect.objectContaining({ status: 'active' }),
    )
    expect(attempts.replace).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: 'confirmed' }),
    )
  })
  it('is idempotent for a confirmed attempt', async () => {
    attempts.findByUserId.mockResolvedValue(
      fakeUserRegistrationAttempt({
        status: 'confirmed',
        userId: 'subject',
        email: 'maria@example.com',
        confirmationTokenHash: 'confirmation-hash',
      }),
    )
    await expect(
      useCase.execute({
        providerSubject: 'subject',
        verifiedEmail: 'maria@example.com',
        confirmationToken: 'confirmation',
      }),
    ).resolves.toBeUndefined()
    expect(establishments.replace).not.toHaveBeenCalled()
  })
})
