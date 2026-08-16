import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'

import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type {
  EstablishmentsRepository,
  IdentityDatabase,
} from '#identity/interfaces/index.ts'
import { GetEstablishmentSettingsUseCase } from '#identity/use-cases/get-establishment-settings-use-case.ts'

describe('Get Establishment Settings Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let useCase: GetEstablishmentSettingsUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    database.run.mockImplementation((operation) =>
      operation({
        establishmentsRepository,
        usersRepository: mock(),
        registrationAttemptsRepository: mock(),
      }),
    )
    useCase = new GetEstablishmentSettingsUseCase(database)
  })

  it('returns only the authenticated manager establishment projection', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const establishment = {
      id: actor.establishmentId,
      name: 'Scoops Centro',
      status: 'active' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    }
    establishmentsRepository.findById.mockResolvedValue(establishment)

    await expect(useCase.execute({ actor })).resolves.toEqual({
      establishment,
      responsibleManager: { id: actor.id, name: actor.name },
    })
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(actor.establishmentId)
  })

  it('rejects an operator before reading establishment data', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Operator })

    await expect(useCase.execute({ actor })).rejects.toBeInstanceOf(
      ProfileChangeNotAllowedError,
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('uses the actor establishment scope and rejects missing data', async () => {
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    establishmentsRepository.findById.mockResolvedValue(undefined)

    await expect(useCase.execute({ actor })).rejects.toMatchObject({
      message: 'Establishment not found',
    })
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(actor.establishmentId)
  })
})
