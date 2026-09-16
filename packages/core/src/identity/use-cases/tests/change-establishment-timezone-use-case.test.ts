import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { EstablishmentAuditAction } from '#identity/domain/structures/establishment-audit-action.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { EstablishmentTimezone } from '#identity/domain/structures/establishment-timezone.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type {
  EstablishmentAuditRecordsRepository,
  EstablishmentsRepository,
  IdentityDatabase,
  IdentityDatabaseRepositories,
  UserAuditRecordsRepository,
  UsersRepository,
} from '#identity/interfaces/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import { ChangeEstablishmentTimezoneUseCase } from '#identity/use-cases/change-establishment-timezone-use-case.ts'

describe('ChangeEstablishmentTimezoneUseCase', () => {
  let database: MockProxy<IdentityDatabase>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let establishmentAuditRecordsRepository: MockProxy<EstablishmentAuditRecordsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ChangeEstablishmentTimezoneUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    establishmentAuditRecordsRepository = mock<EstablishmentAuditRecordsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    const scope: IdentityDatabaseRepositories = {
      establishmentsRepository,
      registrationAttemptsRepository: mock(),
      usersRepository: mock<UsersRepository>(),
      userAuditRecordsRepository: mock<UserAuditRecordsRepository>(),
      establishmentAuditRecordsRepository,
      eventsRepository: mock<EventsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    datetimeProvider.now.mockReturnValue(new Date('2026-09-13T12:00:00.000Z'))
    useCase = new ChangeEstablishmentTimezoneUseCase(database, datetimeProvider)
  })

  it('changes a manager timezone and records the audit', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Shop',
      status: 'active' as const,
      timeZone: EstablishmentTimezone.SaoPaulo,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    const updated = {
      ...establishment,
      timeZone: EstablishmentTimezone.Manaus,
      updatedAt: new Date('2026-09-13T12:00:00.000Z'),
    }
    establishmentsRepository.findById.mockResolvedValue(establishment)
    establishmentsRepository.replace.mockResolvedValue(updated)

    await expect(
      useCase.execute({ actor, timeZone: EstablishmentTimezone.Manaus }),
    ).resolves.toMatchObject({ establishment: updated })
    expect(establishmentAuditRecordsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        action: EstablishmentAuditAction.EstablishmentTimezoneChanged,
        previousValue: EstablishmentTimezone.SaoPaulo,
        newValue: EstablishmentTimezone.Manaus,
        occurredAt: new Date('2026-09-13T12:00:00.000Z'),
      }),
    )
  })

  it('rejects operators before opening the transaction', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Operator })

    await expect(
      useCase.execute({ actor, timeZone: EstablishmentTimezone.Manaus }),
    ).rejects.toBeInstanceOf(ProfileChangeNotAllowedError)
    expect(database.run).not.toHaveBeenCalled()
  })

  it('treats the current timezone as a no-op without replacing or auditing', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Shop',
      status: 'active' as const,
      timeZone: EstablishmentTimezone.SaoPaulo,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    establishmentsRepository.findById.mockResolvedValue(establishment)

    await expect(
      useCase.execute({ actor, timeZone: EstablishmentTimezone.SaoPaulo }),
    ).resolves.toMatchObject({ establishment })
    expect(establishmentsRepository.replace).not.toHaveBeenCalled()
    expect(establishmentAuditRecordsRepository.add).not.toHaveBeenCalled()
  })
})
