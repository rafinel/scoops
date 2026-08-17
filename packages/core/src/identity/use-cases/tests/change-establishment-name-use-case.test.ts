import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import type {
  EstablishmentAuditRecordsRepository,
  EstablishmentsRepository,
  EstablishmentAuditRecordsRepository as EstablishmentAuditRepository,
  IdentityDatabase,
  IdentityDatabaseScope,
  UserAuditRecordsRepository,
  UsersRepository,
} from '#identity/interfaces/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { ChangeEstablishmentNameUseCase } from '#identity/use-cases/change-establishment-name-use-case.ts'

describe('Change Establishment Name Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let establishmentAuditRecordsRepository: MockProxy<EstablishmentAuditRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let scope: IdentityDatabaseScope
  let useCase: ChangeEstablishmentNameUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    establishmentAuditRecordsRepository = mock<EstablishmentAuditRecordsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    scope = {
      establishmentsRepository,
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock(),
      userAuditRecordsRepository: mock<UserAuditRecordsRepository>(),
      establishmentAuditRecordsRepository,
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetimeProvider.now.mockReturnValue(new Date('2026-08-16T14:00:00.000Z'))
    useCase = new ChangeEstablishmentNameUseCase(database, datetimeProvider, broker)
  })

  it('trims a manager rename, accepts duplicates, and writes an establishment audit', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Original Shop',
      status: 'active' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    const updatedEstablishment = { ...establishment, name: 'Shared Shop Name' }
    establishmentsRepository.findById.mockResolvedValue(establishment)
    establishmentsRepository.replace.mockResolvedValue(updatedEstablishment)

    await expect(
      useCase.execute({ actor, name: '  Shared Shop Name  ' }),
    ).resolves.toMatchObject({
      establishment: { id: actor.establishmentId, name: 'Shared Shop Name' },
      responsibleManager: { id: actor.id, name: actor.name },
    })
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(actor.establishmentId)
    expect(establishmentsRepository.replace).toHaveBeenCalledWith(actor.establishmentId, {
      name: 'Shared Shop Name',
      updatedAt: new Date('2026-08-16T14:00:00.000Z'),
    })
    expect(establishmentAuditRecordsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        establishmentId: actor.establishmentId,
        affectedEstablishmentName: 'Shared Shop Name',
        previousValue: 'Original Shop',
        newValue: 'Shared Shop Name',
        actorUserId: actor.id,
      }),
    )
    expect(broker.publish).toHaveBeenCalledTimes(1)
  })

  it('rejects operators and empty names without writing', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Operator })

    await expect(useCase.execute({ actor, name: 'New Shop' })).rejects.toBeInstanceOf(
      ProfileChangeNotAllowedError,
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Manager }),
        name: '  ',
      }),
    ).rejects.toBeInstanceOf(ProfileChangeNotAllowedError)
    expect(database.run).not.toHaveBeenCalled()
  })

  it('treats an unchanged name as a successful no-op without audit or event', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Current Shop',
      status: 'active' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    establishmentsRepository.findById.mockResolvedValue(establishment)

    await expect(useCase.execute({ actor, name: 'Current Shop' })).resolves.toMatchObject(
      {
        establishment,
      },
    )
    expect(establishmentsRepository.replace).not.toHaveBeenCalled()
    expect(establishmentAuditRecordsRepository.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('does not publish an event when the audit transaction fails', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Original Shop',
      status: 'active' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    establishmentsRepository.findById.mockResolvedValue(establishment)
    establishmentsRepository.replace.mockResolvedValue({
      ...establishment,
      name: 'New Shop',
    })
    establishmentAuditRecordsRepository.add.mockRejectedValue(new Error('audit failed'))

    await expect(useCase.execute({ actor, name: 'New Shop' })).rejects.toThrow(
      'audit failed',
    )
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
