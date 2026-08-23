import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { AccompanimentTypeFaker } from '#mrp/domain/entities/fakers/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import { CreateAccompanimentTypeUseCase } from '#mrp/use-cases/create-accompaniment-type-use-case.ts'

describe('Create Accompaniment Type Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: CreateAccompanimentTypeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.accompanimentTypesRepository.findByName.mockResolvedValue(undefined)
    scope.accompanimentTypesRepository.add.mockResolvedValue(
      AccompanimentTypeFaker.fake({ establishmentId: 'e1', name: 'Sauces' }),
    )
    useCase = new CreateAccompanimentTypeUseCase(database)
  })

  it('trims the name and creates exactly once for the tenant', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
      name: '  Sauces  ',
    })
    expect(scope.accompanimentTypesRepository.findByName).toHaveBeenCalledWith(
      'e1',
      'Sauces',
    )
    expect(scope.accompanimentTypesRepository.add).toHaveBeenCalledWith({
      establishmentId: 'e1',
      name: 'Sauces',
    })
  })

  it('rejects blank/overlong, duplicate-case and operator requests without adding', async () => {
    const actor = { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager }
    await expect(useCase.execute({ actor, name: '   ' })).rejects.toBeInstanceOf(
      BadRequestError,
    )
    await expect(
      useCase.execute({ actor, name: 'x'.repeat(121) }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.accompanimentTypesRepository.findByName.mockResolvedValue(
      AccompanimentTypeFaker.fake(),
    )
    await expect(useCase.execute({ actor, name: ' sauces ' })).rejects.toBeInstanceOf(
      ConflictError,
    )
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        name: 'New',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
