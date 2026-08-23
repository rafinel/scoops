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
import { RemoveAccompanimentTypeUseCase } from '#mrp/use-cases/remove-accompaniment-type-use-case.ts'

const type = AccompanimentTypeFaker.fake({ id: 'type-1', establishmentId: 'e1' })

describe('Remove Accompaniment Type Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveAccompanimentTypeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.productAccompanimentsRepository.countByTypeId.mockResolvedValue(0)
    useCase = new RemoveAccompanimentTypeUseCase(database)
  })

  it('removes an unused type with an exact tenant-qualified call', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
      typeId: type.id,
    })
    expect(scope.productAccompanimentsRepository.countByTypeId).toHaveBeenCalledWith(
      'e1',
      type.id,
    )
    expect(scope.accompanimentTypesRepository.remove).toHaveBeenCalledWith('e1', type.id)
  })

  it('protects in-use, missing/foreign and operator branches without partial deletion', async () => {
    scope.productAccompanimentsRepository.countByTypeId.mockResolvedValue(1)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        typeId: type.id,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.accompanimentTypesRepository.remove).not.toHaveBeenCalled()
    scope.productAccompanimentsRepository.countByTypeId.mockResolvedValue(0)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        typeId: type.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
        typeId: type.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
