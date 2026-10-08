import { describe, expect, it } from 'vitest'
import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { InactivateUserUseCase } from '#identity/use-cases/inactivate-user-use-case.ts'
import { UserStatusChangeNotAllowedError } from '#identity/domain/errors/user-status-change-not-allowed-error.ts'
import { UserInactivatedEvent } from '#identity/domain/events/user-inactivated-event.ts'
import type { UserAuditRecordsRepository } from '#identity/interfaces/user-audit-records-repository.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

describe('Inactivate User Use Case', () => {
  // Session revocation remains inside the provider-neutral transaction boundary.
  it('rejects self-inactivation before reading the target', async () => {
    const database = mock<IdentityDatabase>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const scope: IdentityDatabaseRepositories = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository: mock(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())
    await expect(useCase.execute({ actor, userId: actor.id })).rejects.toBeInstanceOf(
      UserStatusChangeNotAllowedError,
    )
    expect(database.run).toHaveBeenCalledTimes(1)
  })

  it('rejects non-manager actors before opening a transaction', async () => {
    const database = mock<IdentityDatabase>()
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())

    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
      }),
    ).rejects.toThrow('É necessário ter acesso de gerente.')

    expect(database.run).not.toHaveBeenCalled()
  })

  it('reports a missing target without attempting an update', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository: mock(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())

    await expect(useCase.execute({ actor, userId: 'missing-user-id' })).rejects.toThrow(
      'Usuário não encontrado.',
    )

    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('inactivates a user and records the notification event in the transaction', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const userAuditRecordsRepository = mock<UserAuditRecordsRepository>()
    const eventsRepository = mock<EventsRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const target = UserFaker.fake({
      establishmentId: actor.establishmentId,
      status: UserStatus.Active,
      profile: UserProfile.Operator,
    })
    const updated = { ...target, status: UserStatus.Inactive }
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository,
      eventsRepository,
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.replace.mockResolvedValue(updated)
    usersRepository.countActiveManagers.mockResolvedValue(1)
    userAuditRecordsRepository.findManyByUser.mockResolvedValue([])
    const datetimeProvider = mock<DatetimeProvider>()
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    datetimeProvider.now.mockReturnValue(occurredAt)

    const result = await new InactivateUserUseCase(database, datetimeProvider).execute({
      actor,
      userId: target.id,
    })

    expect(result).toMatchObject({
      user: expect.objectContaining({
        id: target.id,
        status: UserStatus.Inactive,
        updatedAt: occurredAt,
      }),
      auditRecords: [],
    })
    expect(userAuditRecordsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: `${target.id}:${occurredAt.toISOString()}:inactive`,
        establishmentId: target.establishmentId,
        affectedUserId: target.id,
        actorUserId: actor.id,
        previousValue: UserStatus.Active,
        newValue: UserStatus.Inactive,
        occurredAt,
      }),
    )
    expect(usersRepository.replace).toHaveBeenCalledWith(
      target.establishmentId,
      target.id,
      { status: UserStatus.Inactive, updatedAt: occurredAt },
    )
    expect(eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: UserInactivatedEvent._NAME,
        payload: expect.objectContaining({
          userId: target.id,
          establishmentId: target.establishmentId,
          email: target.email,
          userName: target.name,
          actorUserId: actor.id,
          previousStatus: UserStatus.Active,
          status: UserStatus.Inactive,
          updatedAt: occurredAt,
        }),
      }),
    )
    expect(usersRepository.countActiveManagers).not.toHaveBeenCalled()
  })

  it('returns an already inactive user without applying the transition again', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const target = UserFaker.fake({
      establishmentId: actor.establishmentId,
      status: UserStatus.Inactive,
    })
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository: mock(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())

    await expect(useCase.execute({ actor, userId: target.id })).resolves.toMatchObject({
      user: target,
      auditRecords: [],
    })

    expect(usersRepository.replace).not.toHaveBeenCalled()
    expect(usersRepository.countActiveManagers).not.toHaveBeenCalled()
  })

  it('inactivates a user when optional audit and session repositories are unavailable', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const eventsRepository = mock<EventsRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const target = UserFaker.fake({
      establishmentId: actor.establishmentId,
      status: UserStatus.Active,
      profile: UserProfile.Operator,
    })
    const updated = { ...target, status: UserStatus.Inactive }
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository,
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.replace.mockResolvedValue(updated)
    usersRepository.countActiveManagers.mockResolvedValue(2)
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(occurredAt)

    const result = await new InactivateUserUseCase(database, datetimeProvider).execute({
      actor,
      userId: target.id,
    })

    expect(result).toMatchObject({ user: updated, auditRecords: [] })
    expect(usersRepository.replace).toHaveBeenCalledWith(
      target.establishmentId,
      target.id,
      { status: UserStatus.Inactive, updatedAt: occurredAt },
    )
    expect(eventsRepository.add).toHaveBeenCalledTimes(1)
  })

  it('keeps the last active manager from being inactivated', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const target = UserFaker.fake({
      establishmentId: actor.establishmentId,
      status: UserStatus.Active,
      profile: UserProfile.Manager,
    })
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository: mock(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.countActiveManagers.mockResolvedValue(1)
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())

    await expect(useCase.execute({ actor, userId: target.id })).rejects.toBeInstanceOf(
      UserStatusChangeNotAllowedError,
    )

    expect(usersRepository.countActiveManagers).toHaveBeenCalledWith(
      actor.establishmentId,
    )
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })
})
