import { describe, expect, it } from 'vitest'
import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { InactivateUserUseCase } from '#identity/use-cases/inactivate-user-use-case.ts'
import { UserStatusChangeNotAllowedError } from '#identity/domain/errors/user-status-change-not-allowed-error.ts'
import { UserInactivatedEvent } from '#identity/domain/events/user-inactivated-event.ts'
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

  it('inactivates a user and records the notification event in the transaction', async () => {
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
    const datetimeProvider = mock<DatetimeProvider>()
    const occurredAt = new Date('2026-01-01T00:00:00.000Z')
    datetimeProvider.now.mockReturnValue(occurredAt)

    await new InactivateUserUseCase(database, datetimeProvider).execute({
      actor,
      userId: target.id,
    })

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
  })
})
