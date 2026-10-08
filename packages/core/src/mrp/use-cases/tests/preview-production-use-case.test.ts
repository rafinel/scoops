import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { PreviewProductionUseCase } from '#mrp/use-cases/preview-production-use-case.ts'

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

describe('Preview Production Use Case', () => {
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: PreviewProductionUseCase

  beforeEach(() => {
    const database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
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
      quantity: id === product.id ? 1 : 0,
      situation: 'normal',
    }))
    useCase = new PreviewProductionUseCase(database)
  })

  it('reports shortages without changing stock', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 2 },
    })
    expect(result.canProduce).toBe(false)
    expect(result.consumptions[0]?.missingQuantity).toBe(2)
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
  })

  it('returns calculated costs, batch count, and projected output for producible production', async () => {
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
      quantity: id === product.id ? 3 : 8,
      situation: 'normal',
    }))

    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 4 },
    })

    expect(result).toMatchObject({
      quantity: 4,
      recipeYield: 2,
      batches: 2,
      totalCost: 8,
      currentOutputStock: 3,
      projectedOutputStock: 7,
      canProduce: true,
      blockReasons: [],
      consumptions: [
        expect.objectContaining({
          quantity: 4,
          currentBalance: 8,
          projectedBalance: 4,
          missingQuantity: 0,
          lineCost: 8,
        }),
      ],
    })
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(scope.productionsRepository.add).not.toHaveBeenCalled()
  })

  it('does not block shortages for ingredients that allow negative stock', async () => {
    const ingredientAllowingNegativeStock = ProductFaker.fake({
      ...ingredient,
      allowNegativeStock: true,
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredientAllowingNegativeStock,
    )
    scope.stockBalancesRepository.findByProductId.mockImplementation(async (id) => ({
      productId: id,
      quantity: id === product.id ? 0 : 0,
      situation: 'normal',
    }))

    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 2 },
    })

    expect(result.canProduce).toBe(true)
    expect(result.consumptions[0]).toMatchObject({
      projectedBalance: -2,
      missingQuantity: 2,
      allowsNegativeStock: true,
    })
    expect(result.blockReasons).toEqual([])
  })

  it('deduplicates missing ingredient reasons and treats absent output stock as a blocker', async () => {
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === product.id) return product
      if (id === 'missing-ingredient') return undefined
      return ingredient
    })
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: 'recipe-1',
        ingredientProductId: 'missing-ingredient',
        quantity: 1,
      }),
      RecipeIngredientFaker.fake({
        id: 'line-2',
        establishmentId: product.establishmentId,
        recipeId: 'recipe-1',
        ingredientProductId: 'missing-ingredient',
        quantity: 2,
      }),
    ])
    scope.stockBalancesRepository.findByProductId.mockResolvedValue(undefined)

    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    })

    expect(result.canProduce).toBe(false)
    expect(result.currentOutputStock).toBe(0)
    expect(result.projectedOutputStock).toBe(1)
    expect(result.blockReasons).toEqual([
      'Um ingrediente da receita não está disponível.',
      'O produto fabricável não possui saldo de estoque.',
    ])
    expect(result.consumptions).toHaveLength(2)
    expect(result.consumptions[0]).toMatchObject({
      ingredientProductName: 'Ingrediente indisponível',
      missingQuantity: 0,
      allowsNegativeStock: false,
    })
  })

  it('rejects non-manager requests and quantities outside the supported precision', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Operator,
        },
        productId: product.id,
        input: { quantity: 1 },
      }),
    ).rejects.toThrow('Somente gestores podem pré-visualizar a produção.')

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
        input: { quantity: 1.0001 },
      }),
    ).rejects.toThrow('A quantidade deve ser positiva e ter até três casas decimais.')

    expect(scope.productsRepository.findById).not.toHaveBeenCalled()
  })

  it('blocks inactive and non-ingredient products without looking up their stock', async () => {
    const inactiveIngredient = ProductFaker.fake({
      ...ingredient,
      status: ProductStatus.Inactive,
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : inactiveIngredient,
    )
    const inactiveResult = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    })
    expect(inactiveResult.blockReasons).toContain('Milk está inativo.')
    expect(scope.stockBalancesRepository.findByProductId).toHaveBeenCalledTimes(1)

    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id
        ? product
        : ProductFaker.fake({
            ...ingredient,
            categories: [ProductCategory.Resale],
          }),
    )
    scope.stockBalancesRepository.findByProductId.mockClear()
    const nonIngredientResult = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    })

    expect(nonIngredientResult.blockReasons).toContain('Milk não é ingrediente.')
    expect(scope.stockBalancesRepository.findByProductId).toHaveBeenCalledTimes(1)
  })

  it('rejects missing, non-manufacturable and brand-stock output products', async () => {
    const request = {
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    }

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow('Produto não encontrado.')

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({ ...product, categories: [ProductCategory.Ingredient] }),
    )
    await expect(useCase.execute(request)).rejects.toThrow('O produto não é fabricável.')

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({ ...product, stockControl: ProductStockControl.ByBrand }),
    )
    await expect(useCase.execute(request)).rejects.toThrow(
      'Produtos fabricáveis devem usar estoque único.',
    )
    expect(scope.recipesRepository.findByProductId).not.toHaveBeenCalled()
  })

  it('requires a valid recipe and at least one recipe ingredient', async () => {
    const request = {
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    }

    scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow(
      'O produto ainda não possui uma receita válida.',
    )

    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        yieldQuantity: 0,
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow(
      'O produto ainda não possui uma receita válida.',
    )

    scope.recipesRepository.findByProductId.mockResolvedValue(
      RecipeFaker.fake({
        id: 'recipe-1',
        establishmentId: product.establishmentId,
        productId: product.id,
        yieldQuantity: 2,
      }),
    )
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow(
      'A receita deve possuir pelo menos um ingrediente.',
    )
  })

  it('omits a batch count when the requested quantity is a fractional batch', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { quantity: 1 },
    })

    expect(result).not.toHaveProperty('batches')
    expect(result.quantity).toBe(1)
    expect(result.recipeYield).toBe(2)
  })
})
