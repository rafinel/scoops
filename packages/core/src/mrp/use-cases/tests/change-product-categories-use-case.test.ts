import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import { ChangeProductCategoriesUseCase } from '#mrp/use-cases/change-product-categories-use-case.ts'

const updatedAt = new Date('2026-01-01T00:00:00.000Z')
const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  updatedAt,
  categories: [ProductCategory.Ingredient, ProductCategory.Portion],
})
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Change Product Categories Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let broker: MockProxy<Broker>
  let useCase: ChangeProductCategoriesUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    broker = mock<Broker>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productsRepository.replace.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    })
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([])
    scope.productSizesRepository.countByProductId.mockResolvedValue(0)
    scope.productAccompanimentsRepository.countByProductId.mockResolvedValue(0)
    useCase = new ChangeProductCategoriesUseCase(database, broker)
  })

  it('rechecks removed dependencies in the transaction and publishes after a successful change', async () => {
    const result = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: {
        categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
        expectedUpdatedAt: updatedAt,
      },
    })

    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    })
    expect(broker.publish).toHaveBeenCalledTimes(1)
    expect(result.product.categories).toEqual([
      ProductCategory.Portion,
      ProductCategory.Accompaniment,
    ])
  })

  it('rejects dependency races, stale versions, invalid sets, and operators before writes', async () => {
    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([
      {
        id: 'line-1',
        establishmentId: 'e1',
        recipeId: 'recipe-1',
        ingredientProductId: 'p1',
        quantity: 1,
        createdAt: updatedAt,
        updatedAt,
      },
    ])
    scope.recipesRepository.findById.mockResolvedValue({
      id: 'recipe-1',
      establishmentId: 'e1',
      productId: 'consumer-1',
      yieldQuantity: 1,
      createdAt: updatedAt,
      updatedAt,
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()

    scope.recipeIngredientsRepository.findManyByIngredientProductId.mockResolvedValue([])
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: {
          categories: [ProductCategory.Portion, ProductCategory.Resale],
          expectedUpdatedAt: updatedAt,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        input: { categories: [ProductCategory.Portion], expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('rejects manufacturable for products controlled by brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
    })

    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: {
          categories: [...product.categories, ProductCategory.Manufacturable],
          expectedUpdatedAt: updatedAt,
        },
      }),
    ).rejects.toMatchObject({
      message: 'Produtos fabricáveis devem usar estoque único.',
    })
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })
})
