import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, RecipeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { SaveRecipeYieldUseCase } from '#mrp/use-cases/save-recipe-yield-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})

describe('Save Recipe Yield Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: SaveRecipeYieldUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipesRepository.findByProductId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValue(
        RecipeFaker.fake({
          id: 'recipe-1',
          establishmentId: product.establishmentId,
          productId: product.id,
          yieldQuantity: 2,
        }),
      )
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])
    useCase = new SaveRecipeYieldUseCase(database)
  })

  it('creates an empty recipe only after a valid explicit yield', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { yieldQuantity: 2 },
    })

    expect(scope.recipesRepository.add).toHaveBeenCalledWith({
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity: 2,
    })
    expect(result.recipe?.ingredients).toEqual([])
  })

  it('rejects invalid precision without a write', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
        input: { yieldQuantity: 1.0001 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })

  const actor = {
    id: 'manager-1',
    establishmentId: product.establishmentId,
    profile: UserProfile.Manager,
  }
  const save = (yieldQuantity: number, overrides: { profile?: UserProfile } = {}) =>
    useCase.execute({
      actor: { ...actor, ...overrides },
      productId: product.id,
      input: { yieldQuantity },
    })

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    await expect(save(2, { profile: UserProfile.Operator })).rejects.toThrow(
      new AuthorizationError('Somente gestores podem salvar receitas.'),
    )

    expect(database.run).not.toHaveBeenCalled()
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.0001, 12.3456])(
    'rejects the yield %s with the yield message before opening a transaction',
    async (yieldQuantity) => {
      await expect(save(yieldQuantity)).rejects.toThrow(
        new BadRequestError(
          'O rendimento deve ser positivo e ter até três casas decimais.',
        ),
      )

      expect(database.run).not.toHaveBeenCalled()
    },
  )

  it.each([0.001, 2.5, 1234.567])('accepts the yield %s', async (yieldQuantity) => {
    await save(yieldQuantity)

    expect(scope.recipesRepository.add).toHaveBeenCalledExactlyOnceWith({
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity,
    })
  })

  it('reports a missing product with its message and writes nothing', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)

    await expect(save(2)).rejects.toThrow(new NotFoundError('Produto não encontrado.'))

    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      product.establishmentId,
      product.id,
    )
    expect(scope.recipesRepository.findByProductId).not.toHaveBeenCalled()
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
    expect(scope.recipesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects products that are not Manufacturable with the recipe message and writes nothing', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Ingredient],
    })

    await expect(save(2)).rejects.toThrow(
      new BadRequestError('O produto não é fabricável.'),
    )

    expect(scope.recipesRepository.findByProductId).not.toHaveBeenCalled()
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
    expect(scope.recipesRepository.replace).not.toHaveBeenCalled()
  })

  it('replaces only the yield of an existing recipe without adding another one', async () => {
    scope.recipesRepository.findByProductId.mockReset()
    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        yieldQuantity: 2,
      }),
    )

    await save(3.5)

    expect(scope.recipesRepository.findByProductId).toHaveBeenCalledWith(
      product.establishmentId,
      product.id,
    )
    expect(scope.recipesRepository.replace).toHaveBeenCalledExactlyOnceWith(
      product.establishmentId,
      'recipe-1',
      { yieldQuantity: 3.5 },
    )
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })
})
