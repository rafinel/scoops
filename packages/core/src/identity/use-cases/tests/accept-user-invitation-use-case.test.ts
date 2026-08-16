import { describe, expect, it } from 'vitest'
import { AcceptUserInvitationUseCase } from '#identity/use-cases/accept-user-invitation-use-case.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { mock } from 'vitest-mock-extended'
import { UserFaker, UserRegistrationAttemptFaker } from '#identity/domain/entities/fakers'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { IdentityDatabaseScope } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'

describe('Accept User Invitation Use Case', () => {
  it('does not activate an unknown confirmation token', async () => {
    const database = mock<IdentityDatabase>()
    const registrationAttemptsRepository = mock<RegistrationAttemptsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository,
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    const tokens = mock<OnboardingTokenProvider>()
    tokens.hash.mockReturnValue('hash')
    registrationAttemptsRepository.findPendingByTokenHash.mockResolvedValue(undefined)
    const useCase = new AcceptUserInvitationUseCase(
      database,
      mock<DatetimeProvider>(),
      tokens,
      mock<OnboardingIdentifierProvider>(),
    )
    await expect(
      useCase.execute({
        authUser: { id: 'auth', email: 'a@example.com' },
        confirmationToken: 'token',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rejects a valid token when the provider subject does not match the invitation', async () => {
    const database = mock<IdentityDatabase>()
    const registrationAttemptsRepository = mock<RegistrationAttemptsRepository>()
    const usersRepository = mock<UsersRepository>()
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'invitee@example.com',
      status: UserStatus.Pending,
    })
    const attempt = UserRegistrationAttemptFaker.fake({
      userId: user.id,
      type: RegistrationAttemptType.UserInvitation,
      email: user.email,
      status: RegistrationAttemptStatus.Pending,
    })
    const scope: IdentityDatabaseScope = {
      usersRepository,
      registrationAttemptsRepository,
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    registrationAttemptsRepository.findPendingByTokenHash.mockResolvedValue(attempt)
    usersRepository.findById.mockResolvedValue(user)
    const tokens = mock<OnboardingTokenProvider>()
    tokens.hash.mockReturnValue('hash')
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    const useCase = new AcceptUserInvitationUseCase(
      database,
      datetimeProvider,
      tokens,
      mock<OnboardingIdentifierProvider>(),
    )

    await expect(
      useCase.execute({
        authUser: { id: '00000000-0000-0000-0000-000000000002', email: user.email },
        confirmationToken: 'token',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('treats a used invitation link as idempotent for the same active subject', async () => {
    const database = mock<IdentityDatabase>()
    const registrationAttemptsRepository = mock<RegistrationAttemptsRepository>()
    const usersRepository = mock<UsersRepository>()
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'invitee@example.com',
      status: UserStatus.Active,
    })
    const attempt = UserRegistrationAttemptFaker.fake({
      userId: user.id,
      type: RegistrationAttemptType.UserInvitation,
      email: user.email,
      status: RegistrationAttemptStatus.Confirmed,
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
    })
    const scope: IdentityDatabaseScope = {
      usersRepository,
      registrationAttemptsRepository,
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    registrationAttemptsRepository.findPendingByTokenHash.mockResolvedValue(attempt)
    usersRepository.findById.mockResolvedValue(user)
    const tokens = mock<OnboardingTokenProvider>()
    tokens.hash.mockReturnValue('hash')
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    const broker = mock<Broker>()
    const useCase = new AcceptUserInvitationUseCase(
      database,
      datetimeProvider,
      tokens,
      mock<OnboardingIdentifierProvider>(),
      broker,
    )

    await expect(
      useCase.execute({
        authUser: { id: user.id, email: user.email },
        confirmationToken: 'token',
      }),
    ).resolves.toBeUndefined()
    expect(usersRepository.replace).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
