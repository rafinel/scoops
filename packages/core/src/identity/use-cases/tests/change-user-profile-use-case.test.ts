import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { ChangeUserProfileUseCase } from '#identity/use-cases/change-user-profile-use-case.ts'

describe('Change User Profile Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let scope: IdentityDatabaseScope
  let usersRepository: MockProxy<UsersRepository>
  let useCase: ChangeUserProfileUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    datetimeProvider = mock<DatetimeProvider>()
    usersRepository = mock<UsersRepository>()
    scope = {
      usersRepository,
      establishmentsRepository: mock<EstablishmentsRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetimeProvider.now.mockReturnValue(new Date('2026-02-03T04:05:06.000Z'))
    useCase = new ChangeUserProfileUseCase(database, datetimeProvider)
  })

  it('changes another same-establishment user and captures time once before the transaction', async () => {
    const actor = AccountFaker.fake()
    const target = UserFaker.fake({
      id: 'target-id',
      establishmentId: actor.establishmentId,
      profile: UserProfile.Operator,
    })
    const updatedUser = { ...target, profile: UserProfile.Manager }
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.replace.mockResolvedValue(updatedUser)

    await expect(
      useCase.execute({ actor, userId: target.id, profile: UserProfile.Manager }),
    ).resolves.toMatchObject({ user: updatedUser, auditRecords: [] })
    expect(datetimeProvider.now).toHaveBeenCalledTimes(1)
    expect(usersRepository.replace).toHaveBeenCalledWith(
      actor.establishmentId,
      target.id,
      {
        profile: UserProfile.Manager,
        updatedAt: new Date('2026-02-03T04:05:06.000Z'),
      },
    )
  })

  it('returns the existing user without writing when the profile is unchanged', async () => {
    const actor = AccountFaker.fake()
    const target = UserFaker.fake({
      id: 'target-id',
      establishmentId: actor.establishmentId,
      profile: UserProfile.Operator,
    })
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)

    await expect(
      useCase.execute({ actor, userId: target.id, profile: UserProfile.Operator }),
    ).resolves.toMatchObject({ user: target, auditRecords: [] })
    expect(usersRepository.countActiveManagers).not.toHaveBeenCalled()
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects self-change before looking up the target', async () => {
    const actor = AccountFaker.fake()

    await expect(
      useCase.execute({ actor, userId: actor.id, profile: UserProfile.Operator }),
    ).rejects.toBeInstanceOf(ProfileChangeNotAllowedError)
    expect(usersRepository.findByIdInEstablishment).not.toHaveBeenCalled()
  })

  it('rejects a missing target without writing', async () => {
    const actor = AccountFaker.fake()
    usersRepository.findByIdInEstablishment.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ actor, userId: 'other-user', profile: UserProfile.Operator }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(usersRepository.findByIdInEstablishment).toHaveBeenCalledWith(
      actor.establishmentId,
      'other-user',
    )
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects a cross-establishment target even if the repository returns one', async () => {
    const actor = AccountFaker.fake()
    usersRepository.findByIdInEstablishment.mockResolvedValue(
      UserFaker.fake({
        id: 'other-user',
        establishmentId: 'other-establishment',
      }),
    )

    await expect(
      useCase.execute({ actor, userId: 'other-user', profile: UserProfile.Operator }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects demoting the last active Manager', async () => {
    const actor = AccountFaker.fake()
    const target = UserFaker.fake({
      id: 'manager-id',
      establishmentId: actor.establishmentId,
      profile: UserProfile.Manager,
      status: UserStatus.Active,
    })
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.countActiveManagers.mockResolvedValue(1)

    await expect(
      useCase.execute({ actor, userId: target.id, profile: UserProfile.Operator }),
    ).rejects.toBeInstanceOf(ProfileChangeNotAllowedError)
    expect(usersRepository.countActiveManagers).toHaveBeenCalledWith(
      actor.establishmentId,
    )
    expect(usersRepository.replace).not.toHaveBeenCalled()
  })

  it('propagates a transaction conflict without performing a second transaction itself', async () => {
    const actor = AccountFaker.fake()
    const target = UserFaker.fake({
      id: 'manager-id',
      establishmentId: actor.establishmentId,
      profile: UserProfile.Manager,
    })
    const conflict = new ConflictError('Profile change conflict')
    usersRepository.findByIdInEstablishment.mockResolvedValue(target)
    usersRepository.countActiveManagers.mockResolvedValue(2)
    usersRepository.replace.mockRejectedValue(conflict)

    await expect(
      useCase.execute({ actor, userId: target.id, profile: UserProfile.Operator }),
    ).rejects.toBe(conflict)
    expect(database.run).toHaveBeenCalledTimes(1)
  })
})
