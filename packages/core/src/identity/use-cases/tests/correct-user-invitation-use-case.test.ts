import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import {
  UserFaker,
  UserRegistrationAttemptFaker,
} from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { CorrectUserInvitationUseCase } from '#identity/use-cases/correct-user-invitation-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type {
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '#identity/interfaces/index.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { UserInvitationPreparedEvent } from '#identity/domain/events/user-invitation-prepared-event.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'

describe('Correct User Invitation Use Case', () => {
  it('rejects non-manager actors before reading an invitation', async () => {
    const database = mock<IdentityDatabase>()
    const useCase = new CorrectUserInvitationUseCase(
      database,
      mock<DatetimeProvider>(),
      mock<OnboardingIdentifierProvider>(),
      mock<OnboardingTokenProvider>(),
      mock<UserAccessIdentityProvider>(),
      mock<Broker>(),
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
        name: 'Name',
        email: 'a@example.com',
        profile: UserProfile.Operator,
        invitationRedirectBaseUrl: 'https://example.com/invitation',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()
  })

  it('passes the user establishment to the provider when correcting an invitation', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const attempts = mock<RegistrationAttemptsRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      establishmentId: actor.establishmentId,
      email: 'old@example.com',
      status: UserStatus.Pending,
    })
    const attempt = UserRegistrationAttemptFaker.fake({
      id: '00000000-0000-0000-0000-000000000002',
      userId: user.id,
      establishmentId: user.establishmentId,
      email: user.email,
      status: RegistrationAttemptStatus.Pending,
    })
    const scope: IdentityDatabaseScope = {
      usersRepository: users,
      registrationAttemptsRepository: attempts,
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    users.findByIdInEstablishment.mockResolvedValue(user)
    users.findByEmail.mockResolvedValue(undefined)
    users.replace.mockResolvedValue({
      ...user,
      email: 'new@example.com',
      name: 'New Name',
    })
    attempts.findByUserId.mockResolvedValue(attempt)
    attempts.findActiveByEmail.mockResolvedValue(undefined)
    attempts.claimInvitationOperation.mockResolvedValue(attempt)
    attempts.finalizeInvitationOperation.mockResolvedValue({
      ...attempt,
      email: 'new@example.com',
      revision: attempt.revision + 1,
    })
    const tokenProvider = mock<OnboardingTokenProvider>()
    tokenProvider.issue.mockReturnValue({ token: 'new-token', hash: 'new-hash' })
    const identifierProvider = mock<OnboardingIdentifierProvider>()
    identifierProvider.generate.mockReturnValue('operation-token')
    const provider = mock<UserAccessIdentityProvider>()
    provider.correctPendingIdentity.mockResolvedValue(
      new UserInvitationPreparedEvent({
        userId: user.id,
        establishmentId: user.establishmentId,
        email: 'new@example.com',
        name: 'New Name',
        actionUrl: 'https://example.com/invitation?confirmationToken=new-token',
        expiresAt: '2026-01-08T00:00:00.000Z',
        occurredAt: '2026-01-02T00:00:00.000Z',
        operation: 'corrected',
      }),
    )
    const broker = mock<Broker>()
    const useCase = new CorrectUserInvitationUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      identifierProvider,
      tokenProvider,
      provider,
      broker,
    )

    await useCase.execute({
      actor,
      userId: user.id,
      name: 'New Name',
      email: 'new@example.com',
      profile: UserProfile.Operator,
      invitationRedirectBaseUrl: 'https://example.com/invitation',
    })

    expect(provider.correctPendingIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        providerSubject: user.id,
        establishmentId: user.establishmentId,
      }),
    )
  })
})
