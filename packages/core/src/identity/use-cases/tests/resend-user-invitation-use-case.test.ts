import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import {
  UserFaker,
  UserRegistrationAttemptFaker,
} from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { ResendUserInvitationUseCase } from '#identity/use-cases/resend-user-invitation-use-case.ts'
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

describe('Resend User Invitation Use Case', () => {
  it('rejects non-manager actors before issuing a new token', async () => {
    const tokenProvider = mock<OnboardingTokenProvider>()
    const useCase = new ResendUserInvitationUseCase(
      mock<IdentityDatabase>(),
      mock<DatetimeProvider>(),
      tokenProvider,
      mock<OnboardingIdentifierProvider>(),
      mock<UserAccessIdentityProvider>(),
      mock<Broker>(),
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
        invitationRedirectBaseUrl: 'https://example.com/invitation',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(tokenProvider.issue).not.toHaveBeenCalled()
  })

  it('passes the user establishment to the provider when resending an invitation', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const attempts = mock<RegistrationAttemptsRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      establishmentId: actor.establishmentId,
      email: 'invitee@example.com',
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
    users.replace.mockResolvedValue(user)
    attempts.findByUserId.mockResolvedValue(attempt)
    attempts.claimInvitationOperation.mockResolvedValue({
      ...attempt,
      pendingTokenHash: 'new-hash',
      pendingExpiresAt: new Date('2026-01-09T00:00:00.000Z'),
    })
    attempts.finalizeInvitationOperation.mockResolvedValue(attempt)
    const tokenProvider = mock<OnboardingTokenProvider>()
    tokenProvider.issue.mockReturnValue({ token: 'new-token', hash: 'new-hash' })
    const identifierProvider = mock<OnboardingIdentifierProvider>()
    identifierProvider.generate.mockReturnValue('operation-token')
    const provider = mock<UserAccessIdentityProvider>()
    provider.prepareInvitationResend.mockResolvedValue(
      new UserInvitationPreparedEvent({
        userId: user.id,
        establishmentId: user.establishmentId,
        email: user.email,
        name: user.name,
        actionUrl: 'https://example.com/invitation?confirmationToken=new-token',
        expiresAt: '2026-01-09T00:00:00.000Z',
        occurredAt: '2026-01-02T00:00:00.000Z',
        operation: 'resent',
      }),
    )
    const broker = mock<Broker>()
    const useCase = new ResendUserInvitationUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )

    await useCase.execute({
      actor,
      userId: user.id,
      invitationRedirectBaseUrl: 'https://example.com/invitation',
    })

    expect(provider.prepareInvitationResend).toHaveBeenCalledWith(
      expect.objectContaining({
        providerSubject: user.id,
        establishmentId: user.establishmentId,
      }),
    )
  })
})
