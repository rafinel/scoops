import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { AccompanimentTypeFaker } from '#mrp/domain/entities/fakers/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RenameAccompanimentTypeUseCase } from '#mrp/use-cases/rename-accompaniment-type-use-case.ts'

const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId: 'e1',
  name: 'Sauces',
})

describe('Rename Accompaniment Type Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RenameAccompanimentTypeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.accompanimentTypesRepository.findByName.mockResolvedValue(undefined)
    scope.accompanimentTypesRepository.replace.mockResolvedValue({
      ...type,
      name: 'Toppings',
    })
    useCase = new RenameAccompanimentTypeUseCase(database)
  })

  it('renames a shared type and leaves identity intact', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        typeId: type.id,
        name: '  Toppings  ',
      }),
    ).resolves.toMatchObject({ id: type.id, name: 'Toppings' })
    expect(scope.accompanimentTypesRepository.replace).toHaveBeenCalledWith(
      'e1',
      type.id,
      { name: 'Toppings' },
    )
  })

  it('is idempotent for the normalized current name and rejects duplicate/missing/operator branches', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
      typeId: type.id,
      name: ' sauces ',
    })
    expect(scope.accompanimentTypesRepository.replace).not.toHaveBeenCalled()
    scope.accompanimentTypesRepository.findByName.mockResolvedValue({
      ...type,
      id: 'other-type',
    })
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        typeId: type.id,
        name: 'Toppings',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        typeId: type.id,
        name: 'New',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
        typeId: type.id,
        name: 'New',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
