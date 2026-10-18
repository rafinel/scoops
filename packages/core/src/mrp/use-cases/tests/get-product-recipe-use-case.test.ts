import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  BrandFaker,
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '#mrp/domain/structures/index.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { GetProductRecipeUseCase } from '#mrp/use-cases/get-product-recipe-use-case.ts'

const product = ProductFaker.fake({
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Cake',
  categories: [ProductCategory.Manufacturable],
  stockControl: ProductStockControl.Single,
})

describe('Get Product Recipe Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: GetProductRecipeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.recipesRepository.findByProductId.mockResolvedValue(undefined)
    useCase = new GetProductRecipeUseCase(database)
  })

  it('returns a null recipe without creating one', async () => {
    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
    })
    expect(result).toEqual({ product, recipe: null })
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })

  it('allows operators to read recipes without creating them', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Operator,
        },
        productId: product.id,
      }),
    ).resolves.toEqual({ product, recipe: null })
    expect(scope.recipesRepository.add).not.toHaveBeenCalled()
  })

  describe('with a saved recipe', () => {
    const actor = {
      id: 'manager-1',
      establishmentId: product.establishmentId,
      profile: UserProfile.Manager,
    }
    const recipe = RecipeFaker.fake({
      id: 'recipe-1',
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity: 4,
    })
    const milk = ProductFaker.fake({
      id: 'milk-1',
      establishmentId: product.establishmentId,
      name: 'Milk',
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      currentUnitCost: 2,
    })
    const chocolate = ProductFaker.fake({
      id: 'chocolate-1',
      establishmentId: product.establishmentId,
      name: 'Chocolate',
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
    })
    const primaryBrand = BrandFaker.fake({
      id: 'brand-primary',
      productId: chocolate.id,
      name: 'Primary',
      packageQuantity: 4,
      packagePrice: 10,
      isPrimary: true,
    })
    const alternativeBrand = BrandFaker.fake({
      id: 'brand-alternative',
      productId: chocolate.id,
      name: 'Alternative',
      packageQuantity: 2,
      packagePrice: 12,
      isPrimary: false,
    })
    const milkLine = RecipeIngredientFaker.fake({
      id: 'line-milk',
      establishmentId: product.establishmentId,
      recipeId: recipe.id,
      ingredientProductId: milk.id,
      quantity: 1.5,
    })
    const chocolateLine = RecipeIngredientFaker.fake({
      id: 'line-chocolate',
      establishmentId: product.establishmentId,
      recipeId: recipe.id,
      ingredientProductId: chocolate.id,
      ingredientBrandId: primaryBrand.id,
      quantity: 2,
    })

    function useProducts(...products: (typeof product)[]) {
      const all = [product, ...products]
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        all.find((item) => item.id === id),
      )
    }

    beforeEach(() => {
      useProducts(milk, chocolate)
      scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        milkLine,
        chocolateLine,
      ])
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        alternativeBrand,
        primaryBrand,
      ])
      scope.stockBalancesRepository.findByProductId.mockResolvedValue({
        productId: milk.id,
        quantity: 10,
        situation: 'normal',
      })
      scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
        productId: chocolate.id,
        brandId: primaryBrand.id,
        quantity: 3,
        situation: 'normal',
      })
    })

    it('calculates costs, capacity, limiting line and cost shares', async () => {
      const result = await useCase.execute({ actor, productId: product.id })

      expect(scope.recipesRepository.findByProductId).toHaveBeenCalledWith(
        product.establishmentId,
        product.id,
      )
      expect(scope.recipeIngredientsRepository.findByRecipeId).toHaveBeenCalledWith(
        product.establishmentId,
        recipe.id,
      )
      expect(scope.stockBalancesRepository.findByProductAndBrand).toHaveBeenCalledWith(
        chocolate.id,
        primaryBrand.id,
      )
      expect(result.recipe).toEqual({
        id: recipe.id,
        yieldQuantity: 4,
        totalCost: 8,
        unitCost: 2,
        maximumProducibleQuantity: 6,
        ingredients: [
          {
            id: 'line-milk',
            ingredientProductId: milk.id,
            ingredientProductName: 'Milk',
            ingredientBrandId: undefined,
            ingredientBrandName: undefined,
            unit: milk.unit,
            quantity: 1.5,
            unitCost: 2,
            lineCost: 3,
            cogsPercentage: 37.5,
            currentBalance: 10,
            capacity: 26.666,
            isLimiting: false,
          },
          {
            id: 'line-chocolate',
            ingredientProductId: chocolate.id,
            ingredientProductName: 'Chocolate',
            ingredientBrandId: primaryBrand.id,
            ingredientBrandName: 'Primary',
            unit: chocolate.unit,
            quantity: 2,
            unitCost: 2.5,
            lineCost: 5,
            cogsPercentage: 62.5,
            currentBalance: 3,
            capacity: 6,
            isLimiting: true,
          },
        ],
      })
    })

    it('uses the brand selected on the line instead of the primary one', async () => {
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        { ...chocolateLine, ingredientBrandId: alternativeBrand.id },
      ])

      const result = await useCase.execute({ actor, productId: product.id })

      expect(scope.stockBalancesRepository.findByProductAndBrand).toHaveBeenCalledWith(
        chocolate.id,
        alternativeBrand.id,
      )
      expect(result.recipe?.ingredients[0]).toMatchObject({
        ingredientBrandId: alternativeBrand.id,
        ingredientBrandName: 'Alternative',
        unitCost: 6,
        lineCost: 12,
      })
    })

    it('falls back to the primary brand when the line brand no longer exists', async () => {
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        { ...chocolateLine, ingredientBrandId: 'removed-brand' },
      ])

      const result = await useCase.execute({ actor, productId: product.id })

      expect(result.recipe?.ingredients[0]).toMatchObject({
        ingredientBrandId: primaryBrand.id,
        ingredientBrandName: 'Primary',
      })
    })

    it('reports an empty recipe with zero totals and no producible quantity', async () => {
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])

      const result = await useCase.execute({ actor, productId: product.id })

      expect(result.recipe).toEqual({
        id: recipe.id,
        yieldQuantity: 4,
        totalCost: 0,
        unitCost: 0,
        maximumProducibleQuantity: 0,
        ingredients: [],
      })
    })

    it('floors capacity at zero for negative balances and zero cost shares', async () => {
      useProducts({ ...milk, currentUnitCost: 0 })
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([milkLine])
      scope.stockBalancesRepository.findByProductId.mockResolvedValue({
        productId: milk.id,
        quantity: -5,
        situation: 'normal',
      })

      const result = await useCase.execute({ actor, productId: product.id })

      expect(result.recipe?.maximumProducibleQuantity).toBe(0)
      expect(result.recipe?.ingredients[0]).toMatchObject({
        capacity: 0,
        cogsPercentage: 0,
        isLimiting: true,
        currentBalance: -5,
      })
    })

    it('marks every line tied for the lowest capacity as limiting', async () => {
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        milkLine,
        { ...milkLine, id: 'line-milk-2' },
      ])

      const result = await useCase.execute({ actor, productId: product.id })

      expect(result.recipe?.ingredients.map((line) => line.isLimiting)).toEqual([
        true,
        true,
      ])
    })

    it('rejects a line whose ingredient product is gone', async () => {
      useProducts(chocolate)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente da receita não está disponível.'),
      )
    })

    it('rejects an inactive ingredient', async () => {
      useProducts({ ...milk, status: ProductStatus.Inactive }, chocolate)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente da receita está inativo.'),
      )
    })

    it('rejects a line product that is not an ingredient', async () => {
      useProducts({ ...milk, categories: [ProductCategory.Manufacturable] }, chocolate)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um produto da receita não é um ingrediente elegível.'),
      )
    })

    it('rejects a single-stock ingredient without current unit cost', async () => {
      useProducts({ ...milk, currentUnitCost: undefined }, chocolate)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente não possui custo unitário atual.'),
      )
    })

    it('rejects a single-stock ingredient without stock balance', async () => {
      scope.stockBalancesRepository.findByProductId.mockResolvedValue(undefined)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente não possui saldo de estoque.'),
      )
    })

    it('rejects a by-brand ingredient without a primary brand', async () => {
      scope.brandsRepository.findManyByProductId.mockResolvedValue([
        { ...primaryBrand, isPrimary: false },
      ])
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        { ...chocolateLine, ingredientBrandId: undefined },
      ])

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente não possui marca principal.'),
      )
    })

    it('rejects a by-brand ingredient without brand stock balance', async () => {
      scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue(undefined)

      await expect(useCase.execute({ actor, productId: product.id })).rejects.toThrow(
        new BadRequestError('Um ingrediente não possui saldo de estoque.'),
      )
    })
  })

  it('rejects profiles that cannot consult recipes', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'guest-1',
          establishmentId: product.establishmentId,
          profile: 'guest' as never,
        },
        productId: product.id,
      }),
    ).rejects.toThrow(
      new AuthorizationError('Somente gestores podem consultar receitas.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects an unknown product scoped to the actor establishment', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: 'missing',
      }),
    ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      product.establishmentId,
      'missing',
    )
  })

  it('rejects products that are not manufacturable', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      categories: [ProductCategory.Ingredient],
    })

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
      }),
    ).rejects.toThrow(new BadRequestError('O produto não é fabricável.'))
  })
})
