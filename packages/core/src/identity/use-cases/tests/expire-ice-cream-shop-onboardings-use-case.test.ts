import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserRegistrationAttemptFaker } from '#identity/domain/entities/fakers/index.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { ExpireIceCreamShopOnboardingsUseCase } from '#identity/use-cases/expire-ice-cream-shop-onboardings-use-case.ts'

describe('Expire Ice Cream Shop Onboardings Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let attempts: MockProxy<RegistrationAttemptsRepository>
  let establishments: MockProxy<EstablishmentsRepository>
  let provider: MockProxy<OnboardingIdentityProvider>
  let userProvider: MockProxy<UserAccessIdentityProvider>
  let users: MockProxy<UsersRepository>
  let datetime: MockProxy<DatetimeProvider>
  let scope: IdentityDatabaseScope
  let useCase: ExpireIceCreamShopOnboardingsUseCase
  beforeEach(() => {
    database = mock<IdentityDatabase>()
    attempts = mock<RegistrationAttemptsRepository>()
    establishments = mock<EstablishmentsRepository>()
    provider = mock<OnboardingIdentityProvider>()
    userProvider = mock<UserAccessIdentityProvider>()
    users = mock<UsersRepository>()
    datetime = mock<DatetimeProvider>()
    scope = {
      registrationAttemptsRepository: attempts,
      establishmentsRepository: establishments,
      usersRepository: users,
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetime.now.mockReturnValue(new Date('2026-01-09T00:00:00.000Z'))
    useCase = new ExpireIceCreamShopOnboardingsUseCase(database, datetime, provider)
  })
  it('claims and removes expired identities and establishment', async () => {
    const claim = UserRegistrationAttemptFaker.fake({
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

  it('claims expired user invitations through the invitation operation arbiter', async () => {
    const claim = UserRegistrationAttemptFaker.fake({
      type: RegistrationAttemptType.UserInvitation,
      status: RegistrationAttemptStatus.Pending,
      userId: 'subject',
      establishmentId: 'establishment',
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
      revision: 3,
    })
    const finalized = {
      ...claim,
      status: RegistrationAttemptStatus.Expired,
      operation: undefined,
      operationToken: undefined,
    }
    attempts.findPendingExpiredByType.mockResolvedValue([claim])
    attempts.claimInvitationOperation.mockResolvedValue({
      ...claim,
      operation: InvitationOperation.Expire,
      operationToken: 'expire-operation',
    })
    attempts.finalizeInvitationOperation.mockResolvedValue(finalized)
    userProvider.removeIdentity.mockResolvedValue()
    users.remove.mockResolvedValue()
    attempts.remove.mockResolvedValue()

    const useCaseWithUserProvider = new ExpireIceCreamShopOnboardingsUseCase(
      database,
      datetime,
      provider,
      userProvider,
    )

    await expect(
      useCaseWithUserProvider.execute({ limit: 100, claimToken: 'claim' }),
    ).resolves.toEqual({ expired: 1, removed: 1, failed: 0 })
    expect(attempts.claimInvitationOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: claim.id,
        expectedRevision: 3,
        operation: InvitationOperation.Expire,
      }),
    )
    expect(userProvider.removeIdentity).toHaveBeenCalledWith('subject')
    expect(users.remove).toHaveBeenCalledWith('establishment', 'subject')
  })

  it('reconciles a stale email correction only after verifying the provider subject', async () => {
    const claim = UserRegistrationAttemptFaker.fake({
      type: RegistrationAttemptType.UserInvitation,
      status: RegistrationAttemptStatus.Pending,
      userId: 'subject',
      establishmentId: 'establishment',
      operation: InvitationOperation.CorrectEmail,
      operationToken: 'correction-operation',
      pendingEmail: 'new@example.com',
    })
    attempts.findStaleInvitationOperations.mockResolvedValue([claim])
    userProvider.getIdentityEmail.mockResolvedValue('new@example.com')
    attempts.finalizeInvitationOperation.mockResolvedValue({
      ...claim,
      email: 'new@example.com',
      operation: undefined,
      operationToken: undefined,
    })
    users.replace.mockResolvedValue({
      ...UserRegistrationAttemptFaker.fake(),
      id: 'subject',
      establishmentId: 'establishment',
      email: 'new@example.com',
    } as never)

    const useCaseWithUserProvider = new ExpireIceCreamShopOnboardingsUseCase(
      database,
      datetime,
      provider,
      userProvider,
    )

    await useCaseWithUserProvider.execute({ limit: 100, claimToken: 'claim' })

    expect(userProvider.getIdentityEmail).toHaveBeenCalledWith('subject')
    expect(attempts.finalizeInvitationOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: claim.id,
        operationToken: 'correction-operation',
        changes: expect.objectContaining({ email: 'new@example.com' }),
      }),
    )
    expect(users.replace).toHaveBeenCalledWith(
      'establishment',
      'subject',
      expect.objectContaining({ email: 'new@example.com' }),
    )
  })
})
