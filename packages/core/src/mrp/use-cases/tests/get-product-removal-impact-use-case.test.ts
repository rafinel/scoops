import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { GetProductRemovalImpactUseCase } from '#mrp/use-cases/get-product-removal-impact-use-case.ts'

const product = ProductFaker.fake({ id: 'p1', establishmentId: 'e1', name: 'Milk' })
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Get Product Removal Impact Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: GetProductRemovalImpactUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.countByProductId.mockResolvedValue(2)
    scope.stockBalancesRepository.countByProductId.mockResolvedValue(3)
    scope.recipesRepository.countByProductId.mockResolvedValue(1)
    scope.productSizesRepository.countByProductId.mockResolvedValue(4)
    scope.resaleConfigurationsRepository.countByProductId.mockResolvedValue(5)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(6)
    scope.recipeIngredientsRepository.countByIngredientProductId.mockResolvedValue(7)
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      8,
    )
    scope.stockTransactionsRepository.countByProductId.mockResolvedValue(9)
    scope.productionsRepository.countByProductId.mockResolvedValue(10)
    useCase = new GetProductRemovalImpactUseCase(database)
  })

  it('returns current removable counts and retained history without deleting history', async () => {
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).resolves.toEqual({
      productName: 'Milk',
      removable: {
        brands: 2,
        balances: 3,
        ownedRecipe: 1,
        sizes: 4,
        resaleConfigurations: 5,
        ownedAccompanimentLinks: 6,
        consumingRecipeLinks: 7,
        inverseAccompanimentLinks: 8,
      },
      retainedHistory: { stockTransactions: 9, productions: 10, orders: 0 },
    })
    expect(scope.stockTransactionsRepository.removeAll).not.toHaveBeenCalled()
    expect(scope.productionsRepository.removeAll).not.toHaveBeenCalled()
  })

  it('hides foreign products and rejects operators', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
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
