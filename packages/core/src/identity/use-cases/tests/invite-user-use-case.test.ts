import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { InviteUserUseCase } from '#identity/use-cases/invite-user-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider, Broker } from '#shared/interfaces/index.ts'
import type {
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '#identity/interfaces/index.ts'
import {
  UserAuditRecordFaker,
  UserFaker,
  UserRegistrationAttemptFaker,
} from '#identity/domain/entities/fakers'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabaseScope } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { UserAuditRecordsRepository } from '#identity/interfaces/user-audit-records-repository.ts'

describe('Invite User Use Case', () => {
  it('rejects non-manager actors before provider work', async () => {
    const database = mock<IdentityDatabase>()
    const provider = mock<UserAccessIdentityProvider>()
    const useCase = new InviteUserUseCase(
      database,
      mock<DatetimeProvider>(),
      mock<OnboardingTokenProvider>(),
      mock<OnboardingIdentifierProvider>(),
      provider,
      mock<Broker>(),
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        name: 'Name',
        email: 'a@example.com',
        profile: UserProfile.Operator,
        invitationRedirectBaseUrl: 'https://example.com/invitation',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(provider.inviteIdentity).not.toHaveBeenCalled()
  })

  it('does not compensate the provider after a committed invitation broker failure', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const registrationAttemptsRepository = mock<RegistrationAttemptsRepository>()
    const userAuditRecordsRepository = mock<UserAuditRecordsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository,
      registrationAttemptsRepository,
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository,
    }
    database.run.mockImplementation((operation) => operation(scope))
    const now = new Date('2026-01-01T00:00:00.000Z')
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      establishmentId: actor.establishmentId,
      name: 'Invited User',
      email: 'invitee@example.com',
      profile: UserProfile.Operator,
    })
    const attempt = UserRegistrationAttemptFaker.fake({
      id: '00000000-0000-0000-0000-000000000002',
      userId: user.id,
      establishmentId: user.establishmentId,
      name: user.name,
      email: user.email,
      profile: user.profile,
      type: RegistrationAttemptType.UserInvitation,
      status: RegistrationAttemptStatus.Pending,
    })
    usersRepository.findByEmail.mockResolvedValue(undefined)
    registrationAttemptsRepository.findActiveByEmail.mockResolvedValue(undefined)
    usersRepository.add.mockResolvedValue(user)
    registrationAttemptsRepository.add.mockResolvedValue(attempt)
    userAuditRecordsRepository.add.mockResolvedValue(UserAuditRecordFaker.fake())
    userAuditRecordsRepository.findManyByUser.mockResolvedValue([])
    const provider = mock<UserAccessIdentityProvider>()
    provider.inviteIdentity.mockResolvedValue({ providerSubject: user.id })
    const broker = mock<Broker>()
    broker.publish.mockRejectedValue(new Error('broker unavailable'))
    const tokenProvider = mock<OnboardingTokenProvider>()
    tokenProvider.issue.mockReturnValue({ token: 'token', hash: 'hash' })
    const identifierProvider = mock<OnboardingIdentifierProvider>()
    identifierProvider.generate.mockReturnValue(attempt.id)
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(now)
    const useCase = new InviteUserUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )

    await expect(
      useCase.execute({
        actor,
        name: user.name,
        email: user.email,
        profile: user.profile,
        invitationRedirectBaseUrl: 'https://example.com/invitation',
      }),
    ).rejects.toThrow('broker unavailable')
    expect(provider.removeIdentity).not.toHaveBeenCalled()
    expect(usersRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id, status: 'pending' }),
    )
  })
})
