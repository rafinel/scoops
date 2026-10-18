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
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { AddRecipeIngredientUseCase } from '#mrp/use-cases/add-recipe-ingredient-use-case.ts'

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
const recipe = RecipeFaker.fake({
  id: 'recipe-1',
  establishmentId: product.establishmentId,
  productId: product.id,
  yieldQuantity: 2,
})

describe('Add Recipe Ingredient Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: AddRecipeIngredientUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredient,
    )
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findByRecipeAndProduct.mockResolvedValue(undefined)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])
    scope.stockBalancesRepository.findByProductId.mockResolvedValue({
      productId: ingredient.id,
      quantity: 10,
      situation: 'normal',
    })
    useCase = new AddRecipeIngredientUseCase(database)
  })

  it('adds an eligible, costed ingredient once', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      input: { ingredientProductId: ingredient.id, quantity: 1 },
    })
    expect(scope.recipeIngredientsRepository.add).toHaveBeenCalledWith({
      establishmentId: product.establishmentId,
      recipeId: recipe.id,
      ingredientProductId: ingredient.id,
      quantity: 1,
    })
  })

  it('rejects duplicates without adding a line', async () => {
    scope.recipeIngredientsRepository.findByRecipeAndProduct.mockResolvedValue(
      RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
      }),
    )
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: product.establishmentId,
          profile: UserProfile.Manager,
        },
        productId: product.id,
        input: { ingredientProductId: ingredient.id, quantity: 1 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.recipeIngredientsRepository.add).not.toHaveBeenCalled()
  })

  describe('guards', () => {
    const actor = {
      id: 'manager-1',
      establishmentId: product.establishmentId,
      profile: UserProfile.Manager,
    }
    const run = (
      input: {
        ingredientProductId: string
        quantity: number
        ingredientBrandId?: string
      },
      productId = product.id,
    ) => useCase.execute({ actor, productId, input })
    const byBrandIngredient = ProductFaker.fake({
      id: 'ingredient-by-brand',
      establishmentId: product.establishmentId,
      name: 'Chocolate',
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
    })
    const primaryBrand = BrandFaker.fake({
      id: 'brand-primary',
      productId: byBrandIngredient.id,
      isPrimary: true,
    })
    const secondaryBrand = BrandFaker.fake({
      id: 'brand-secondary',
      productId: byBrandIngredient.id,
      isPrimary: false,
    })

    function useIngredient(candidate: typeof ingredient | undefined) {
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        id === product.id ? product : candidate,
      )
    }

    it('rejects non-manager actors before touching the database', async () => {
      await expect(
        useCase.execute({
          actor: { ...actor, profile: UserProfile.Operator },
          productId: product.id,
          input: { ingredientProductId: ingredient.id, quantity: 1 },
        }),
      ).rejects.toThrow(
        new AuthorizationError('Somente gestores podem adicionar ingredientes.'),
      )
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.0001])(
      'rejects invalid quantity %s before touching the database',
      async (quantity) => {
        await expect(
          run({ ingredientProductId: ingredient.id, quantity }),
        ).rejects.toThrow(
          new BadRequestError(
            'A quantidade deve ser positiva e ter até três casas decimais.',
          ),
        )
        expect(database.run).not.toHaveBeenCalled()
      },
    )

    it('accepts a quantity with three decimal places', async () => {
      await run({ ingredientProductId: ingredient.id, quantity: 0.001 })

      expect(scope.recipeIngredientsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 0.001 }),
      )
    })

    it('rejects an unknown recipe product', async () => {
      scope.productsRepository.findById.mockResolvedValue(undefined)

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        product.establishmentId,
        product.id,
      )
    })

    it('rejects a recipe product that is not manufacturable', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Ingredient],
      })

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(new BadRequestError('O produto não é fabricável.'))
    })

    it('requires the recipe yield to be saved first', async () => {
      scope.recipesRepository.findByProductId.mockResolvedValue(undefined)

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestError('Salve o rendimento antes de adicionar ingredientes.'),
      )
      expect(scope.recipesRepository.findByProductId).toHaveBeenCalledWith(
        product.establishmentId,
        product.id,
      )
    })

    it('rejects using the product as its own ingredient', async () => {
      await expect(run({ ingredientProductId: product.id, quantity: 1 })).rejects.toThrow(
        new BadRequestError(
          'Um produto não pode ser ingrediente de sua própria receita.',
        ),
      )
      expect(scope.recipeIngredientsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects an unknown ingredient', async () => {
      useIngredient(undefined)

      await expect(run({ ingredientProductId: 'missing', quantity: 1 })).rejects.toThrow(
        new NotFoundError('Ingrediente não encontrado.'),
      )
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        product.establishmentId,
        'missing',
      )
    })

    it('rejects an inactive ingredient', async () => {
      useIngredient({ ...ingredient, status: ProductStatus.Inactive })

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(new BadRequestError('O ingrediente deve estar ativo.'))
    })

    it('rejects a product that is not an ingredient', async () => {
      useIngredient({ ...ingredient, categories: [ProductCategory.Manufacturable] })

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestError('O produto selecionado não é um ingrediente.'),
      )
    })

    it('rejects a single-stock ingredient without current unit cost', async () => {
      useIngredient({ ...ingredient, currentUnitCost: undefined })

      await expect(
        run({ ingredientProductId: ingredient.id, quantity: 1 }),
      ).rejects.toThrow(
        new BadRequestError('O ingrediente não possui custo unitário atual.'),
      )
    })

    it('rejects a brand for a single-stock ingredient', async () => {
      await expect(
        run({
          ingredientProductId: ingredient.id,
          quantity: 1,
          ingredientBrandId: 'brand-1',
        }),
      ).rejects.toThrow(
        new BadRequestError('Ingrediente com estoque único não possui marca.'),
      )
      expect(scope.recipeIngredientsRepository.add).not.toHaveBeenCalled()
    })

    describe('by-brand ingredients', () => {
      beforeEach(() => {
        useIngredient(byBrandIngredient)
        scope.brandsRepository.findManyByProductId.mockResolvedValue([
          secondaryBrand,
          primaryBrand,
        ])
      })

      it('uses the primary brand when none is requested', async () => {
        await run({ ingredientProductId: byBrandIngredient.id, quantity: 2 })

        expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
          byBrandIngredient.id,
        )
        expect(scope.recipeIngredientsRepository.add).toHaveBeenCalledWith({
          establishmentId: product.establishmentId,
          recipeId: recipe.id,
          ingredientProductId: byBrandIngredient.id,
          ingredientBrandId: primaryBrand.id,
          quantity: 2,
        })
      })

      it('uses the requested brand', async () => {
        await run({
          ingredientProductId: byBrandIngredient.id,
          quantity: 2,
          ingredientBrandId: secondaryBrand.id,
        })

        expect(scope.recipeIngredientsRepository.add).toHaveBeenCalledWith(
          expect.objectContaining({ ingredientBrandId: secondaryBrand.id }),
        )
      })

      it('rejects a requested brand that does not belong to the ingredient', async () => {
        await expect(
          run({
            ingredientProductId: byBrandIngredient.id,
            quantity: 2,
            ingredientBrandId: 'other-brand',
          }),
        ).rejects.toThrow(new NotFoundError('Marca do ingrediente não encontrada.'))
        expect(scope.recipeIngredientsRepository.add).not.toHaveBeenCalled()
      })

      it('rejects an ingredient without a primary brand', async () => {
        scope.brandsRepository.findManyByProductId.mockResolvedValue([secondaryBrand])

        await expect(
          run({ ingredientProductId: byBrandIngredient.id, quantity: 2 }),
        ).rejects.toThrow(
          new BadRequestError('O ingrediente não possui marca principal.'),
        )
      })
    })

    it('checks duplicates by establishment, recipe and ingredient', async () => {
      await run({ ingredientProductId: ingredient.id, quantity: 1 })

      expect(
        scope.recipeIngredientsRepository.findByRecipeAndProduct,
      ).toHaveBeenCalledWith(product.establishmentId, recipe.id, ingredient.id)
    })

    it('returns the refreshed recipe details', async () => {
      const line = RecipeIngredientFaker.fake({
        id: 'line-1',
        establishmentId: product.establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
        quantity: 1,
      })
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([line])

      const result = await run({ ingredientProductId: ingredient.id, quantity: 1 })

      expect(result.product).toBe(product)
      expect(result.recipe?.ingredients).toHaveLength(1)
      expect(result.recipe?.totalCost).toBe(2)
    })
  })
})
