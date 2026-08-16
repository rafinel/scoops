import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserNameChangeNotAllowedError } from '#identity/domain/errors/user-name-change-not-allowed-error.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
  UsersRepository,
  EstablishmentsRepository,
  UserAuditRecordsRepository,
  EstablishmentAuditRecordsRepository,
} from '#identity/interfaces/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { ChangeOwnUserNameUseCase } from '#identity/use-cases/change-own-user-name-use-case.ts'

describe('Change Own User Name Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let usersRepository: MockProxy<UsersRepository>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let userAuditRecordsRepository: MockProxy<UserAuditRecordsRepository>
  let establishmentAuditRecordsRepository: MockProxy<EstablishmentAuditRecordsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let scope: IdentityDatabaseScope
  let useCase: ChangeOwnUserNameUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    usersRepository = mock<UsersRepository>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    userAuditRecordsRepository = mock<UserAuditRecordsRepository>()
    establishmentAuditRecordsRepository = mock<EstablishmentAuditRecordsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    scope = {
      usersRepository,
      establishmentsRepository,
      registrationAttemptsRepository: mock(),
      userAuditRecordsRepository,
      establishmentAuditRecordsRepository,
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetimeProvider.now.mockReturnValue(new Date('2026-08-16T14:00:00.000Z'))
    useCase = new ChangeOwnUserNameUseCase(database, datetimeProvider, broker)
  })

  it.each(['manager', 'operator'] as const)(
    'trims and persists the authenticated %s user name with an audit fact',
    async (profile) => {
      const actor = AccountFaker.fake({ profile })
      const user = UserFaker.fake({
        id: actor.id,
        establishmentId: actor.establishmentId,
        name: actor.name,
        profile,
        status: UserStatus.Active,
      })
      const establishment = {
        id: actor.establishmentId,
        name: 'Scoops Centro',
        status: 'active' as const,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      }
      const updatedUser = { ...user, name: 'Updated Name' }
      usersRepository.findByIdInEstablishment.mockResolvedValue(user)
      usersRepository.replace.mockResolvedValue(updatedUser)
      establishmentsRepository.findById.mockResolvedValue(establishment)

      await expect(useCase.execute({ actor, name: '  Updated Name  ' })).resolves.toEqual(
        {
          id: actor.id,
          establishmentId: actor.establishmentId,
          establishmentName: establishment.name,
          name: 'Updated Name',
          email: user.email,
          profile,
        },
      )

      expect(usersRepository.findByIdInEstablishment).toHaveBeenCalledWith(
        actor.establishmentId,
        actor.id,
      )
      expect(usersRepository.replace).toHaveBeenCalledWith(
        actor.establishmentId,
        actor.id,
        { name: 'Updated Name', updatedAt: new Date('2026-08-16T14:00:00.000Z') },
      )
      expect(userAuditRecordsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({
          affectedUserId: actor.id,
          affectedUserName: 'Updated Name',
          actorUserId: actor.id,
          previousValue: user.name,
          newValue: 'Updated Name',
        }),
      )
      expect(broker.publish).toHaveBeenCalledTimes(1)
    },
  )

  it('rejects an empty normalized name before opening a transaction', async () => {
    const actor = AccountFaker.fake()

    await expect(useCase.execute({ actor, name: '   ' })).rejects.toBeInstanceOf(
      UserNameChangeNotAllowedError,
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('returns the server-authoritative account and does not audit an unchanged name', async () => {
    const actor = AccountFaker.fake({ establishmentName: 'Stale Client Name' })
    const user = UserFaker.fake({
      id: actor.id,
      establishmentId: actor.establishmentId,
      name: 'Current Name',
      status: UserStatus.Active,
    })
    usersRepository.findByIdInEstablishment.mockResolvedValue(user)
    establishmentsRepository.findById.mockResolvedValue({
      id: actor.establishmentId,
      name: 'Current Shop Name',
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    })

    await expect(useCase.execute({ actor, name: 'Current Name' })).resolves.toMatchObject(
      {
        name: 'Current Name',
        establishmentName: 'Current Shop Name',
      },
    )
    expect(usersRepository.replace).not.toHaveBeenCalled()
    expect(userAuditRecordsRepository.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects an inactive authenticated user without writing', async () => {
    const actor = AccountFaker.fake()
    usersRepository.findByIdInEstablishment.mockResolvedValue(
      UserFaker.fake({
        id: actor.id,
        establishmentId: actor.establishmentId,
        status: UserStatus.Inactive,
      }),
    )

    await expect(useCase.execute({ actor, name: 'New Name' })).rejects.toMatchObject({
      message: 'Authenticated account not found',
    })
    expect(usersRepository.replace).not.toHaveBeenCalled()
    expect(userAuditRecordsRepository.add).not.toHaveBeenCalled()
  })

  it('does not publish an event when the audit transaction fails', async () => {
    const actor = AccountFaker.fake()
    const user = UserFaker.fake({
      id: actor.id,
      establishmentId: actor.establishmentId,
      status: UserStatus.Active,
    })
    usersRepository.findByIdInEstablishment.mockResolvedValue(user)
    usersRepository.replace.mockResolvedValue({ ...user, name: 'New Name' })
    establishmentsRepository.findById.mockResolvedValue({
      id: actor.establishmentId,
      name: 'Scoops',
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    })
    userAuditRecordsRepository.add.mockRejectedValue(new Error('audit failed'))

    await expect(useCase.execute({ actor, name: 'New Name' })).rejects.toThrow(
      'audit failed',
    )
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
