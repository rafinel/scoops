import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
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
import { UpdateRecipeIngredientUseCase } from '#mrp/use-cases/update-recipe-ingredient-use-case.ts'

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
const byBrandIngredient = ProductFaker.fake({
  id: 'ingredient-by-brand-1',
  establishmentId: product.establishmentId,
  name: 'Chocolate',
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.ByBrand,
})
const recipe = RecipeFaker.fake({
  id: 'recipe-1',
  establishmentId: product.establishmentId,
  productId: product.id,
  yieldQuantity: 2,
})
const line = RecipeIngredientFaker.fake({
  id: 'line-1',
  establishmentId: product.establishmentId,
  recipeId: recipe.id,
  ingredientProductId: ingredient.id,
})

describe('Update Recipe Ingredient Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: UpdateRecipeIngredientUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === product.id ? product : ingredient,
    )
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findById.mockResolvedValue(line)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([line])
    scope.stockBalancesRepository.findByProductId.mockResolvedValue({
      productId: ingredient.id,
      quantity: 10,
      situation: 'normal',
    })
    useCase = new UpdateRecipeIngredientUseCase(database)
  })

  it('changes only the existing line quantity', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      lineId: line.id,
      input: { quantity: 1.5 },
    })
    expect(scope.recipeIngredientsRepository.replace).toHaveBeenCalledWith(
      product.establishmentId,
      recipe.id,
      line.id,
      { quantity: 1.5 },
    )
  })

  it('persists an explicitly selected ingredient brand', async () => {
    const byBrandLine = { ...line, ingredientProductId: byBrandIngredient.id }
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === product.id) return product
      return id === byBrandIngredient.id ? byBrandIngredient : ingredient
    })
    scope.recipeIngredientsRepository.findById.mockResolvedValue(byBrandLine)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'brand-primary',
        productId: byBrandIngredient.id,
        name: 'Marca principal',
        packageQuantity: 1,
        packagePrice: 4,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'brand-secondary',
        productId: byBrandIngredient.id,
        name: 'Marca alternativa',
        packageQuantity: 1,
        packagePrice: 5,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: product.establishmentId,
        profile: UserProfile.Manager,
      },
      productId: product.id,
      lineId: line.id,
      input: { ingredientBrandId: 'brand-secondary', quantity: 1.5 },
    })

    expect(scope.recipeIngredientsRepository.replace).toHaveBeenCalledWith(
      product.establishmentId,
      recipe.id,
      line.id,
      { ingredientBrandId: 'brand-secondary', quantity: 1.5 },
    )
  })

  describe('guards', () => {
    const actor = {
      id: 'manager-1',
      establishmentId: product.establishmentId,
      profile: UserProfile.Manager,
    }
    const brand = (overrides: Partial<Brand>) =>
      BrandFaker.fake({ productId: byBrandIngredient.id, ...overrides })
    const primaryBrand = brand({ id: 'brand-primary', isPrimary: true })
    const secondaryBrand = brand({ id: 'brand-secondary', isPrimary: false })
    const run = (
      input: { quantity: number; ingredientBrandId?: string },
      overrides: { actor?: ProductActor; lineId?: string } = {},
    ) =>
      useCase.execute({
        actor: overrides.actor ?? actor,
        productId: product.id,
        lineId: overrides.lineId ?? line.id,
        input,
      })

    function useIngredient(candidate: typeof ingredient | undefined) {
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        id === product.id ? product : candidate,
      )
    }

    it('rejects non-manager actors before touching the database', async () => {
      await expect(
        run({ quantity: 1 }, { actor: { ...actor, profile: UserProfile.Operator } }),
      ).rejects.toThrow(
        new AuthorizationError('Somente gestores podem editar ingredientes.'),
      )
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.0001])(
      'rejects invalid quantity %s before touching the database',
      async (quantity) => {
        await expect(run({ quantity })).rejects.toThrow(
          new BadRequestError(
            'A quantidade deve ser positiva e ter até três casas decimais.',
          ),
        )
        expect(database.run).not.toHaveBeenCalled()
      },
    )

    it('accepts a quantity with three decimal places', async () => {
      await run({ quantity: 0.001 })

      expect(scope.recipeIngredientsRepository.replace).toHaveBeenCalledWith(
        product.establishmentId,
        recipe.id,
        line.id,
        { quantity: 0.001 },
      )
    })

    it('rejects an unknown product', async () => {
      scope.productsRepository.findById.mockResolvedValue(undefined)

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new NotFoundError('Produto não encontrado.'),
      )
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        product.establishmentId,
        product.id,
      )
    })

    it('rejects a product that is not manufacturable', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...product,
        categories: [ProductCategory.Ingredient],
      })

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new BadRequestError('O produto não é fabricável.'),
      )
    })

    it('rejects a product without a recipe', async () => {
      scope.recipesRepository.findByProductId.mockResolvedValue(undefined)

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new NotFoundError('Receita não encontrada.'),
      )
      expect(scope.recipesRepository.findByProductId).toHaveBeenCalledWith(
        product.establishmentId,
        product.id,
      )
    })

    it('rejects an unknown recipe line scoped to the recipe', async () => {
      scope.recipeIngredientsRepository.findById.mockResolvedValue(undefined)

      await expect(run({ quantity: 1 }, { lineId: 'missing' })).rejects.toThrow(
        new NotFoundError('Ingrediente da receita não encontrado.'),
      )
      expect(scope.recipeIngredientsRepository.findById).toHaveBeenCalledWith(
        product.establishmentId,
        recipe.id,
        'missing',
      )
      expect(scope.recipeIngredientsRepository.replace).not.toHaveBeenCalled()
    })

    it('rejects a line whose ingredient product no longer exists', async () => {
      useIngredient(undefined)

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new NotFoundError('Ingrediente da receita não encontrado.'),
      )
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        product.establishmentId,
        line.ingredientProductId,
      )
    })

    it('rejects an inactive ingredient', async () => {
      useIngredient({ ...ingredient, status: ProductStatus.Inactive })

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new BadRequestError('O ingrediente deve estar ativo.'),
      )
      expect(scope.recipeIngredientsRepository.replace).not.toHaveBeenCalled()
    })

    it('rejects a line product that is not an ingredient', async () => {
      useIngredient({ ...ingredient, categories: [ProductCategory.Manufacturable] })

      await expect(run({ quantity: 1 })).rejects.toThrow(
        new BadRequestError('O produto selecionado não é um ingrediente.'),
      )
    })

    it('rejects a brand for a single-stock ingredient', async () => {
      await expect(run({ quantity: 1, ingredientBrandId: 'brand-1' })).rejects.toThrow(
        new BadRequestError('Ingrediente com estoque único não possui marca.'),
      )
      expect(scope.recipeIngredientsRepository.replace).not.toHaveBeenCalled()
    })

    describe('by-brand ingredients', () => {
      const byBrandLine = { ...line, ingredientProductId: byBrandIngredient.id }

      beforeEach(() => {
        useIngredient(byBrandIngredient)
        scope.recipeIngredientsRepository.findById.mockResolvedValue(byBrandLine)
        scope.brandsRepository.findManyByProductId.mockResolvedValue([
          secondaryBrand,
          primaryBrand,
        ])
        scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
          productId: byBrandIngredient.id,
          brandId: primaryBrand.id,
          quantity: 5,
          situation: 'normal',
        })
      })

      it('keeps the stored brand when no brand is requested', async () => {
        await run({ quantity: 2 })

        expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
          byBrandIngredient.id,
        )
        expect(scope.recipeIngredientsRepository.replace).toHaveBeenCalledWith(
          product.establishmentId,
          recipe.id,
          line.id,
          { quantity: 2 },
        )
      })

      it('validates the stored brand of the line when no brand is requested', async () => {
        scope.recipeIngredientsRepository.findById.mockResolvedValue({
          ...byBrandLine,
          ingredientBrandId: 'removed-brand',
        })

        await expect(run({ quantity: 2 })).rejects.toThrow(
          new NotFoundError('Marca do ingrediente não encontrada.'),
        )
        expect(scope.recipeIngredientsRepository.replace).not.toHaveBeenCalled()
      })

      it('rejects a requested brand that does not belong to the ingredient', async () => {
        await expect(
          run({ quantity: 2, ingredientBrandId: 'other-brand' }),
        ).rejects.toThrow(new NotFoundError('Marca do ingrediente não encontrada.'))
      })

      it('rejects an ingredient without a primary brand when none is selected', async () => {
        scope.brandsRepository.findManyByProductId.mockResolvedValue([secondaryBrand])

        await expect(run({ quantity: 2 })).rejects.toThrow(
          new NotFoundError('O ingrediente não possui marca principal.'),
        )
      })
    })

    it('returns the refreshed recipe details', async () => {
      const result = await run({ quantity: 1 })

      expect(result.product).toBe(product)
      expect(result.recipe?.id).toBe(recipe.id)
      expect(result.recipe?.ingredients).toHaveLength(1)
    })
  })
})
