import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  ProductSizeFaker,
  RecipeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { RemoveProductUseCase } from '#mrp/use-cases/remove-product-use-case.ts'

const product = ProductFaker.fake({ id: 'p1', establishmentId: 'e1', name: 'Milk' })
const updatedAt = product.updatedAt
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Remove Product Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findByIdForUpdate.mockResolvedValue(product)
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.stockBalancesRepository.countByProductId.mockResolvedValue(1)
    scope.recipesRepository.countByProductId.mockResolvedValue(1)
    scope.productSizesRepository.countByProductId.mockResolvedValue(1)
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(1)
    scope.recipeIngredientsRepository.countByIngredientProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      1,
    )
    scope.stockTransactionsRepository.countByProductId.mockResolvedValue(1)
    scope.productionsRepository.countByProductId.mockResolvedValue(1)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'b1',
        productId: 'p1',
        name: 'Brand',
        packageQuantity: 1,
        packagePrice: 1,
        isPrimary: true,
        createdAt: updatedAt,
        updatedAt,
      },
    ])
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({ id: 'size-1', establishmentId: 'e1', productId: 'p1' }),
    ])
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({ id: 'recipe-1', establishmentId: 'e1', productId: 'p1' }),
    )
    useCase = new RemoveProductUseCase(database)
  })

  it('rechecks impact, removes current inverse configuration, and retains history', async () => {
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).resolves.toBeUndefined()

    expect(scope.productAccompanimentsRepository.removeByProductId).toHaveBeenCalledWith(
      'e1',
      'p1',
    )
    expect(
      scope.productAccompanimentsRepository.removeByAccompanimentProductId,
    ).toHaveBeenCalledWith('e1', 'p1')
    expect(
      scope.recipeIngredientsRepository.removeByIngredientProductId,
    ).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.resaleConfigurationsRepository.removeByProductId).toHaveBeenCalledWith(
      'e1',
      'p1',
    )
    expect(scope.productSizesRepository.remove).toHaveBeenCalledWith('e1', 'p1', 'size-1')
    expect(scope.recipesRepository.remove).toHaveBeenCalledWith('e1', 'recipe-1')
    expect(scope.brandsRepository.remove).toHaveBeenCalledWith('e1', 'p1', 'b1')
    expect(scope.productsRepository.remove).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.stockTransactionsRepository.removeAll).not.toHaveBeenCalled()
    expect(scope.productionsRepository.removeAll).not.toHaveBeenCalled()
  })

  it('hides foreign products and rejects operators before transaction work', async () => {
    scope.productsRepository.findByIdForUpdate.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
