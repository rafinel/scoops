import { describe, expect, it } from 'vitest'
import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { ReactivateUserUseCase } from '#identity/use-cases/reactivate-user-use-case.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserReactivatedEvent } from '#identity/domain/events/user-reactivated-event.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

describe('Reactivate User Use Case', () => {
  it('returns a neutral not-found error for an unknown target', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const scope: IdentityDatabaseRepositories = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      eventsRepository: mock(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(undefined)
    const useCase = new ReactivateUserUseCase(database, mock<DatetimeProvider>())
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Manager }),
        userId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('reactivates an inactive user and records the notification event in the transaction', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const eventsRepository = mock<EventsRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const target = UserFaker.fake({
      establishmentId: actor.establishmentId,
      status: UserStatus.Inactive,
    })
    const updated = { ...target, status: UserStatus.Active }
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

    await new ReactivateUserUseCase(database, datetimeProvider).execute({
      actor,
      userId: target.id,
    })

    expect(eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: UserReactivatedEvent._NAME,
        payload: expect.objectContaining({
          userId: target.id,
          establishmentId: target.establishmentId,
          email: target.email,
          userName: target.name,
          actorUserId: actor.id,
          previousStatus: UserStatus.Inactive,
          profile: updated.profile,
          status: UserStatus.Active,
          updatedAt: occurredAt,
        }),
      }),
    )
  })
})
