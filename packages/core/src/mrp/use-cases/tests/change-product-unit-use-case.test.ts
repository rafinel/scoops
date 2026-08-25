import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ChangeProductUnitUseCase } from '#mrp/use-cases/change-product-unit-use-case.ts'

const updatedAt = new Date('2026-01-01T00:00:00.000Z')
const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  unit: ProductUnit.Gram,
  categories: [ProductCategory.Ingredient, ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
  idealStock: 1_000,
  currentUnitCost: 0.125,
  updatedAt,
})
const brand = {
  id: 'b1',
  productId: 'p1',
  name: 'Brand',
  unit: ProductUnit.Gram,
  packageQuantity: 200,
  packagePrice: 10,
  isPrimary: true,
  createdAt: updatedAt,
  updatedAt,
}
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Change Product Unit Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let broker: MockProxy<Broker>
  let useCase: ChangeProductUnitUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    broker = mock<Broker>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findByIdForUpdate.mockResolvedValue(product)
    scope.productsRepository.replace.mockResolvedValue({
      ...product,
      unit: ProductUnit.Kilogram,
    })
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])
    scope.stockBalancesRepository.findManyByProductId.mockResolvedValue([
      { productId: 'p1', quantity: 100, situation: StockSituation.Normal },
    ])
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: 'e1',
        productId: 'p1',
        yieldQuantity: 1_000,
      }),
    )
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: 'e1',
        ingredientProductId: 'p1',
        quantity: 100,
      }),
    ])
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({
        id: 'size-1',
        establishmentId: 'e1',
        productId: 'p1',
        quantity: 100,
      }),
    ])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          id: 'link-1',
          establishmentId: 'e1',
          accompanimentProductId: 'p1',
          quantityPerPortion: 100,
        }),
      ],
    )
    useCase = new ChangeProductUnitUseCase(database, broker)
  })

  it('updates only the product unit and preserves dependent numeric values', async () => {
    const result = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { targetUnit: ProductUnit.Kilogram, expectedUpdatedAt: updatedAt },
    })

    expect(scope.stockBalancesRepository.replaceQuantity).not.toHaveBeenCalled()
    expect(scope.recipesRepository.replaceYieldQuantity).not.toHaveBeenCalled()
    expect(
      scope.recipeIngredientsRepository.replaceQuantitiesByIngredientProductId,
    ).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.replaceQuantities).not.toHaveBeenCalled()
    expect(
      scope.productAccompanimentsRepository.replaceQuantitiesByAccompanimentProductId,
    ).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      unit: ProductUnit.Kilogram,
    })
    expect(broker.publish).toHaveBeenCalledTimes(1)
    expect(result.unit).toBe(ProductUnit.Kilogram)
  })

  it('allows cross-dimension unit changes without changing numeric values', async () => {
    scope.productsRepository.replace.mockResolvedValue({
      ...product,
      unit: ProductUnit.Liter,
    })

    const result = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { targetUnit: ProductUnit.Liter, expectedUpdatedAt: updatedAt },
    })

    expect(result.unit).toBe(ProductUnit.Liter)
    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      unit: ProductUnit.Liter,
    })
    expect(scope.stockBalancesRepository.replaceQuantity).not.toHaveBeenCalled()
    expect(broker.publish).toHaveBeenCalledTimes(1)
  })

  it('rejects stale, foreign, operator, and dependency failures without publishing success', async () => {
    scope.productsRepository.findByIdForUpdate.mockResolvedValue({
      ...product,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram, expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    scope.productsRepository.findByIdForUpdate.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram, expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    scope.productsRepository.findByIdForUpdate.mockResolvedValue(product)
    scope.productsRepository.replace.mockRejectedValue(new Error('rollback'))
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram, expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toThrow('rollback')
    expect(broker.publish).not.toHaveBeenCalled()

    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram, expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
