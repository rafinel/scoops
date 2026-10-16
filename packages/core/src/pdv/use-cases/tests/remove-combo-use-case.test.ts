import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ComboFaker } from '#pdv/domain/entities/fakers/combo-faker.ts'
import { DiscountDeletedEvent } from '#pdv/domain/events/discount-deleted-event.ts'
import type {
  PdvDatabase,
  PdvDatabaseRepositories,
} from '#pdv/interfaces/pdv-database.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import { RemoveComboUseCase } from '#pdv/use-cases/remove-combo-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
const combo = ComboFaker.fake({
  id: 'combo-1',
  establishmentId: 'e1',
  updatedAt: expectedUpdatedAt,
})

describe('RemoveComboUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let repositories: PdvDatabaseRepositories
  let events: MockProxy<Pick<EventsRepository, 'add'>>
  let useCase: RemoveComboUseCase

  beforeEach(() => {
    const discountsRepository = mock<PdvDatabaseRepositories['discountsRepository']>()
    discountsRepository.findById.mockResolvedValue(combo)
    repositories = mock<PdvDatabaseRepositories>()
    repositories.discountsRepository = discountsRepository
    events = mock<Pick<EventsRepository, 'add'>>()
    repositories.eventsRepository = events
    database = mock<PdvDatabase>()
    database.run.mockImplementation(async (operation) => operation(repositories))
    useCase = new RemoveComboUseCase(database)
  })

  it('rejects non-manager actors before infrastructure access', async () => {
    await expect(
      useCase.execute({ actor, comboId: 'combo-1', expectedUpdatedAt }),
    ).rejects.toThrowError(
      new AuthorizationError('Somente gestores podem gerenciar combos.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects combos that are missing or owned by another establishment', async () => {
    const findById = repositories.discountsRepository.findById
    vi.mocked(findById)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        ...combo,
        establishmentId: 'other-establishment',
      })
    const request = {
      actor: { ...actor, profile: UserProfile.Manager },
      comboId: 'combo-1',
      expectedUpdatedAt,
    }

    await expect(useCase.execute(request)).rejects.toThrowError(
      new NotFoundError('Combo não encontrado.'),
    )
    await expect(useCase.execute(request)).rejects.toThrowError(
      new NotFoundError('Combo não encontrado.'),
    )
    expect(repositories.discountsRepository.remove).not.toHaveBeenCalled()
    expect(events.add).not.toHaveBeenCalled()
  })

  it('rejects stale timestamps without deleting or publishing', async () => {
    const request = {
      actor: { ...actor, profile: UserProfile.Manager },
      comboId: 'combo-1',
      expectedUpdatedAt: new Date('2025-12-31T23:59:59.000Z'),
    }

    await expect(useCase.execute(request)).rejects.toThrowError(
      new ConflictError('O combo foi alterado por outra operação.'),
    )
    expect(repositories.discountsRepository.remove).not.toHaveBeenCalled()
    expect(events.add).not.toHaveBeenCalled()
  })

  it('deletes the expected combo and publishes its deletion event', async () => {
    const request = {
      actor: { ...actor, profile: UserProfile.Manager },
      comboId: 'combo-1',
      expectedUpdatedAt,
    }

    await expect(useCase.execute(request)).resolves.toBeUndefined()
    expect(repositories.discountsRepository.remove).toHaveBeenCalledWith(
      'e1',
      'combo-1',
      expectedUpdatedAt,
    )
    expect(events.add).toHaveBeenCalledWith(expect.any(DiscountDeletedEvent))
    expect(events.add.mock.calls[0][0].payload).toEqual({
      discountId: 'combo-1',
      establishmentId: 'e1',
      type: combo.type,
    })
  })
})
