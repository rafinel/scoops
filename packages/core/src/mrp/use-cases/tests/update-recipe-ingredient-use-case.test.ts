import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStockControl } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
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
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: UpdateRecipeIngredientUseCase

  beforeEach(() => {
    const database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
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
})
