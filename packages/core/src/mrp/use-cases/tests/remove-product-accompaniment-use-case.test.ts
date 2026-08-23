import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RemoveProductAccompanimentUseCase } from '#mrp/use-cases/remove-product-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const link = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
})

describe('Remove Product Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveProductAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(owner)
    scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
    useCase = new RemoveProductAccompanimentUseCase(database)
  })

  it('removes only the tenant-qualified relationship', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
    })
    expect(scope.productAccompanimentsRepository.remove).toHaveBeenCalledWith(
      establishmentId,
      owner.id,
      link.id,
    )
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects missing/invalid owner, link and operator without deleting', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...owner,
      categories: [ProductCategory.Ingredient],
    })
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.productsRepository.findById.mockResolvedValue(owner)
    scope.productAccompanimentsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId, profile: UserProfile.Operator },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
