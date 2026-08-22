import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  ProductionFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStockControl,
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { RegisterProductionUseCase } from '#mrp/use-cases/register-production-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})
const ingredient = ProductFaker.fake({
  id: 'ingredient-1',
  establishmentId: product.establishmentId,
  name: 'Milk',
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  currentUnitCost: 2,
})

describe('Register Production Use Case', () => {
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RegisterProductionUseCase

  beforeEach(() => {
    const database = mock<MrpDatabase>()
    const datetime = mock<DatetimeProvider>()
    scope = mockDeep<MrpDatabaseScope>()
    datetime.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredient,
    )
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        yieldQuantity: 2,
      }),
    )
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: 'recipe-1',
        ingredientProductId: ingredient.id,
        quantity: 2,
      }),
    ])
    scope.stockBalancesRepository.findByProductId.mockImplementation(async (id) => ({
      productId: id,
      quantity: 10,
      situation: StockSituation.Normal,
    }))
    scope.stockBalancesRepository.add.mockResolvedValue({
      productId: ingredient.id,
      quantity: 8,
      situation: StockSituation.Normal,
    })
    scope.productionsRepository.add.mockResolvedValue(
      ProductionFaker.fake({
        id: 'production-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        recipeId: 'recipe-1',
        recipeYield: 2,
        quantity: 2,
        totalCost: 4,
        performedBy: 'manager-1',
        performedByName: 'Manager',
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    )
    useCase = new RegisterProductionUseCase(database, datetime)
  })

  it('atomically records production, snapshots, and correlated movements', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 2 },
    })
    expect(result.id).toBe('production-1')
    expect(scope.productionIngredientsRepository.addMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ productionId: 'production-1', lineCost: 4 }),
      ]),
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledTimes(2)
  })
})
