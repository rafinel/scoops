import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  BrandFaker,
  ProductSizeFaker,
  ProductFaker,
  RecipeFaker,
  RecipeIngredientFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStockControl,
  ProductStatus,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { GetProductPricingUseCase } from '#mrp/use-cases/get-product-pricing-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const portion = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  name: 'Ice Cream',
  unit: ProductUnit.Kilogram,
  categories: [ProductCategory.Portion],
  currentUnitCost: 2,
})
const resaleSingle = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  name: 'Soda',
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  currentUnitCost: undefined,
})
const resaleByBrand = ProductFaker.fake({
  id: 'by-brand-1',
  establishmentId,
  name: 'Coffee',
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
})
const accompanimentOnly = ProductFaker.fake({
  id: 'accompaniment-only-1',
  establishmentId,
  name: 'Sauce',
  categories: [ProductCategory.Accompaniment],
  accompanimentPrice: undefined,
})
const accompanimentResaleSingle = ProductFaker.fake({
  id: 'accompaniment-resale-single-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  accompanimentPrice: undefined,
})
const accompanimentResaleByBrand = ProductFaker.fake({
  id: 'accompaniment-resale-brand-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
  stockControl: ProductStockControl.ByBrand,
  accompanimentPrice: undefined,
})
const savedFreeAccompaniment = ProductFaker.fake({
  id: 'saved-free-accompaniment-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  accompanimentPrice: 0,
})
const unavailableCostPortion = ProductFaker.fake({
  id: 'portion-without-cost-1',
  establishmentId,
  name: 'Unpriced Ice Cream',
  categories: [ProductCategory.Portion],
  currentUnitCost: undefined,
})
const sizes = [
  ProductSizeFaker.fake({
    id: 'size-small',
    establishmentId,
    productId: portion.id,
    name: 'Small',
    quantity: 0.5,
    price: 4,
  }),
  ProductSizeFaker.fake({
    id: 'size-free',
    establishmentId,
    productId: portion.id,
    name: 'Free',
    quantity: 1,
    price: 0,
    isActive: false,
  }),
]
const singleConfiguration = ResaleConfigurationFaker.fake({
  id: 'single-configuration',
  establishmentId,
  productId: resaleSingle.id,
  price: 7.5,
  isActive: true,
})
const mainBrand = {
  id: 'brand-main',
  productId: resaleByBrand.id,
  name: 'Main Brand',
  packageQuantity: 6,
  packagePrice: 30,
  isPrimary: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const secondaryBrand = { ...mainBrand, id: 'brand-secondary', name: 'Secondary' }
const accompanimentMainBrand = {
  ...mainBrand,
  id: 'accompaniment-main-brand',
  productId: accompanimentResaleByBrand.id,
}
const mainBrandConfiguration = ResaleConfigurationFaker.fake({
  id: 'brand-configuration',
  establishmentId,
  productId: resaleByBrand.id,
  brandId: mainBrand.id,
  price: 12,
  isActive: true,
})
const accompanimentSingleConfiguration = ResaleConfigurationFaker.fake({
  id: 'accompaniment-single-configuration',
  establishmentId,
  productId: accompanimentResaleSingle.id,
  price: 8.25,
  isActive: true,
})
const accompanimentByBrandConfiguration = ResaleConfigurationFaker.fake({
  id: 'accompaniment-brand-configuration',
  establishmentId,
  productId: accompanimentResaleByBrand.id,
  brandId: accompanimentMainBrand.id,
  price: 14.75,
  isActive: true,
})

describe('Get Product Pricing Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: GetProductPricingUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(
      async (_establishment, productId): Promise<Product | undefined> => {
        return [
          portion,
          unavailableCostPortion,
          resaleSingle,
          resaleByBrand,
          accompanimentOnly,
          accompanimentResaleSingle,
          accompanimentResaleByBrand,
          savedFreeAccompaniment,
        ].find((product) => product.id === productId)
      },
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue(sizes)
    scope.resaleConfigurationsRepository.findByProductAndBrand.mockImplementation(
      async (_establishment, productId, brandId) => {
        if (productId === resaleSingle.id && brandId === undefined) {
          return singleConfiguration
        }
        if (productId === accompanimentResaleSingle.id && brandId === undefined) {
          return accompanimentSingleConfiguration
        }
        if (productId === savedFreeAccompaniment.id && brandId === undefined) {
          return singleConfiguration
        }
        return undefined
      },
    )
    scope.resaleConfigurationsRepository.findManyByProductId.mockImplementation(
      async (_establishment, productId) =>
        productId === resaleByBrand.id
          ? [mainBrandConfiguration]
          : productId === accompanimentResaleByBrand.id
            ? [accompanimentByBrandConfiguration]
            : [],
    )
    scope.brandsRepository.findManyByProductId.mockImplementation(async (productId) =>
      productId === accompanimentResaleByBrand.id
        ? [accompanimentMainBrand]
        : [mainBrand, secondaryBrand],
    )
    useCase = new GetProductPricingUseCase(database)
  })

  it('projects Portion sizes with optional cost, profit and zero-price margin handling', async () => {
    const result = await useCase.execute({ actor, productId: portion.id })

    expect(result).toMatchObject({ product: portion, mode: 'portion', resale: [] })
    expect(result.sizes).toEqual([
      {
        size: sizes[0],
        operatingCost: 1,
        profit: 3,
        marginPercentage: 75,
      },
      { size: sizes[1], operatingCost: 2, profit: -2 },
    ])
    expect(scope.productSizesRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      portion.id,
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('projects Single and By-brand resale without creating an unbranded fallback', async () => {
    const singleResult = await useCase.execute({ actor, productId: resaleSingle.id })

    expect(singleResult).toMatchObject({
      mode: 'resale-single',
      sizes: [],
      resale: [
        {
          configuration: singleConfiguration,
          packageQuantity: 1,
          price: 7.5,
          isActive: true,
        },
      ],
    })

    const byBrandResult = await useCase.execute({ actor, productId: resaleByBrand.id })

    expect(byBrandResult.resale).toEqual([
      {
        configuration: mainBrandConfiguration,
        brand: mainBrand,
        packageQuantity: 6,
        price: 12,
        isActive: true,
      },
      {
        brand: secondaryBrand,
        packageQuantity: 6,
        isActive: false,
      },
    ])
  })

  it('omits financial metrics when no current cost can be resolved', async () => {
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        price: 4,
      }),
    ])
    const result = await useCase.execute({
      actor,
      productId: unavailableCostPortion.id,
    })

    expect(result.sizes[0]).toEqual({ size: expect.any(Object) })
    expect(result.sizes[0]).not.toHaveProperty('operatingCost')
    expect(result.sizes[0]).not.toHaveProperty('profit')
    expect(result.sizes[0]).not.toHaveProperty('marginPercentage')
  })

  it.each([
    {
      label: 'another establishment',
      size: ProductSizeFaker.fake({
        establishmentId: 'another-establishment',
        productId: portion.id,
      }),
    },
    {
      label: 'another Portion',
      size: ProductSizeFaker.fake({ establishmentId, productId: 'another-portion' }),
    },
  ])('rejects a size owned by $label', async ({ size }) => {
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])

    await expect(
      useCase.execute({ actor, productId: portion.id }),
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(scope.productSizesRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      portion.id,
    )
    expect(scope.recipesRepository.findByProductId).not.toHaveBeenCalled()
  })

  it('calculates Portion cost from eligible ingredients and the selected brand', async () => {
    const recipe = RecipeFaker.fake({
      id: 'portion-recipe',
      establishmentId,
      productId: unavailableCostPortion.id,
      yieldQuantity: 4,
    })
    const singleIngredient = ProductFaker.fake({
      id: 'single-ingredient',
      establishmentId,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      currentUnitCost: 0,
    })
    const byBrandIngredient = ProductFaker.fake({
      id: 'branded-ingredient',
      establishmentId,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    const primaryIngredientBrand = BrandFaker.fake({
      id: 'ingredient-brand-primary',
      productId: byBrandIngredient.id,
      packageQuantity: 10,
      packagePrice: 20,
      isPrimary: true,
    })
    const selectedIngredientBrand = BrandFaker.fake({
      id: 'ingredient-brand-selected',
      productId: byBrandIngredient.id,
      packageQuantity: 5,
      packagePrice: 60,
      isPrimary: false,
    })
    const size = ProductSizeFaker.fake({
      id: 'unpriced-portion-size',
      establishmentId,
      productId: unavailableCostPortion.id,
      quantity: 0.5,
      price: 8,
    })
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: singleIngredient.id,
        quantity: 2,
      }),
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: byBrandIngredient.id,
        ingredientBrandId: selectedIngredientBrand.id,
        quantity: 1,
      }),
    ])
    scope.productsRepository.findById.mockImplementation(
      async (_requestedEstablishmentId, productId) =>
        productId === unavailableCostPortion.id
          ? unavailableCostPortion
          : productId === singleIngredient.id
            ? singleIngredient
            : productId === byBrandIngredient.id
              ? byBrandIngredient
              : undefined,
    )
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.brandsRepository.findManyByProductId.mockImplementation(async (productId) =>
      productId === byBrandIngredient.id
        ? [primaryIngredientBrand, selectedIngredientBrand]
        : [],
    )

    const result = await useCase.execute({
      actor,
      productId: unavailableCostPortion.id,
    })

    expect(result.sizes).toEqual([
      { size, operatingCost: 1.5, profit: 6.5, marginPercentage: 81.25 },
    ])
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(
      byBrandIngredient.id,
    )
  })

  it('uses the primary brand cost when a ByBrand recipe ingredient has no selected brand', async () => {
    const recipe = RecipeFaker.fake({
      id: 'portion-recipe-primary-brand-fallback',
      establishmentId,
      productId: unavailableCostPortion.id,
      yieldQuantity: 2,
    })
    const ingredient = ProductFaker.fake({
      id: 'ingredient-with-primary-brand-fallback',
      establishmentId,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    })
    const primaryBrand = BrandFaker.fake({
      id: 'primary-brand-fallback',
      productId: ingredient.id,
      packageQuantity: 4,
      packagePrice: 20,
      isPrimary: true,
    })
    const secondaryBrand = BrandFaker.fake({
      id: 'secondary-brand-fallback',
      productId: ingredient.id,
      packageQuantity: 2,
      packagePrice: 4,
      isPrimary: false,
    })
    const line = RecipeIngredientFaker.fake({
      establishmentId,
      recipeId: recipe.id,
      ingredientProductId: ingredient.id,
      ingredientBrandId: undefined,
      quantity: 1,
    })
    const size = ProductSizeFaker.fake({
      establishmentId,
      productId: unavailableCostPortion.id,
      quantity: 1,
      price: 10,
    })
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([line])
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.productsRepository.findById.mockImplementation(
      async (_requestedEstablishmentId, productId) =>
        productId === unavailableCostPortion.id
          ? unavailableCostPortion
          : productId === ingredient.id
            ? ingredient
            : undefined,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      secondaryBrand,
      primaryBrand,
    ])

    const result = await useCase.execute({
      actor,
      productId: unavailableCostPortion.id,
    })

    expect(result.sizes).toEqual([
      { size, operatingCost: 2.5, profit: 7.5, marginPercentage: 75 },
    ])
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(ingredient.id)
  })

  it('omits recipe cost when the recipe does not belong to the Portion or has an invalid yield', async () => {
    const invalidRecipes = [
      RecipeFaker.fake({
        establishmentId: 'another-establishment',
        productId: unavailableCostPortion.id,
        yieldQuantity: 2,
      }),
      RecipeFaker.fake({
        establishmentId,
        productId: 'another-product',
        yieldQuantity: 2,
      }),
      RecipeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        yieldQuantity: Number.NaN,
      }),
      RecipeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        yieldQuantity: 0,
      }),
      RecipeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        yieldQuantity: -1,
      }),
    ]
    const size = ProductSizeFaker.fake({
      establishmentId,
      productId: unavailableCostPortion.id,
      quantity: 1,
      price: 5,
    })
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([])

    for (const recipe of invalidRecipes) {
      scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
      const result = await useCase.execute({
        actor,
        productId: unavailableCostPortion.id,
      })

      expect(result.sizes[0]).toEqual({ size })
    }

    expect(scope.recipeIngredientsRepository.findByRecipeId).not.toHaveBeenCalled()
  })

  it('omits recipe cost when any recipe line has invalid ownership or quantity', async () => {
    const recipe = RecipeFaker.fake({
      id: 'portion-recipe',
      establishmentId,
      productId: unavailableCostPortion.id,
      yieldQuantity: 2,
    })
    const ingredient = ProductFaker.fake({
      id: 'valid-ingredient',
      establishmentId,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      currentUnitCost: 4,
    })
    const size = ProductSizeFaker.fake({
      establishmentId,
      productId: unavailableCostPortion.id,
      quantity: 1,
      price: 5,
    })
    const invalidLines = [
      RecipeIngredientFaker.fake({
        establishmentId: 'another-establishment',
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
        quantity: 1,
      }),
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: 'another-recipe',
        ingredientProductId: ingredient.id,
        quantity: 1,
      }),
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
        quantity: Number.NaN,
      }),
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: ingredient.id,
        quantity: -1,
      }),
    ]
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.productsRepository.findById.mockImplementation(
      async (_requestedEstablishmentId, productId) =>
        productId === unavailableCostPortion.id
          ? unavailableCostPortion
          : productId === ingredient.id
            ? ingredient
            : undefined,
    )

    for (const line of invalidLines) {
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([line])
      const result = await useCase.execute({
        actor,
        productId: unavailableCostPortion.id,
      })

      expect(result.sizes[0]).toEqual({ size })
    }
  })

  it('requires recipe ingredients to be active, local and categorized as Ingredient', async () => {
    const recipe = RecipeFaker.fake({
      id: 'portion-recipe',
      establishmentId,
      productId: unavailableCostPortion.id,
      yieldQuantity: 2,
    })
    const eligibleProduct = ProductFaker.fake({
      id: 'ingredient-1',
      establishmentId,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      currentUnitCost: 4,
    })
    const ineligibleProducts = [
      ProductFaker.fake({
        ...eligibleProduct,
        establishmentId: 'another-establishment',
      }),
      ProductFaker.fake({ ...eligibleProduct, status: ProductStatus.Inactive }),
      ProductFaker.fake({ ...eligibleProduct, categories: [ProductCategory.Resale] }),
    ]
    const size = ProductSizeFaker.fake({
      establishmentId,
      productId: unavailableCostPortion.id,
      quantity: 1,
      price: 5,
    })
    scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
    scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
      RecipeIngredientFaker.fake({
        establishmentId,
        recipeId: recipe.id,
        ingredientProductId: eligibleProduct.id,
        quantity: 1,
      }),
    ])
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])

    for (const ineligibleProduct of ineligibleProducts) {
      scope.productsRepository.findById.mockImplementation(
        async (_requestedEstablishmentId, productId) =>
          productId === unavailableCostPortion.id
            ? unavailableCostPortion
            : productId === ineligibleProduct.id
              ? ineligibleProduct
              : undefined,
      )
      const result = await useCase.execute({
        actor,
        productId: unavailableCostPortion.id,
      })

      expect(result.sizes[0]).toEqual({ size })
    }
  })

  it.each([Number.NaN, -1])(
    'omits recipe cost when a Single ingredient has invalid unit cost %s',
    async (currentUnitCost) => {
      const recipe = RecipeFaker.fake({
        id: 'portion-recipe',
        establishmentId,
        productId: unavailableCostPortion.id,
        yieldQuantity: 2,
      })
      const ingredient = ProductFaker.fake({
        id: 'invalid-cost-ingredient',
        establishmentId,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        currentUnitCost,
      })
      const size = ProductSizeFaker.fake({
        establishmentId,
        productId: unavailableCostPortion.id,
        quantity: 1,
        price: 5,
      })
      scope.recipesRepository.findByProductId.mockResolvedValue(recipe)
      scope.recipeIngredientsRepository.findByRecipeId.mockResolvedValue([
        RecipeIngredientFaker.fake({
          establishmentId,
          recipeId: recipe.id,
          ingredientProductId: ingredient.id,
          quantity: 1,
        }),
      ])
      scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
      scope.productsRepository.findById.mockImplementation(
        async (_requestedEstablishmentId, productId) =>
          productId === unavailableCostPortion.id
            ? unavailableCostPortion
            : productId === ingredient.id
              ? ingredient
              : undefined,
      )

      const result = await useCase.execute({
        actor,
        productId: unavailableCostPortion.id,
      })

      expect(result.sizes[0]).toEqual({ size })
    },
  )

  it('supports Accompaniment-only pricing and read-only Resale price suggestions', async () => {
    const accompanimentResult = await useCase.execute({
      actor,
      productId: accompanimentOnly.id,
    })
    expect(accompanimentResult).toMatchObject({
      mode: 'accompaniment',
      sizes: [],
      resale: [],
      accompanimentPrice: null,
      suggestedAccompanimentPrice: null,
    })

    const singleResult = await useCase.execute({
      actor,
      productId: accompanimentResaleSingle.id,
    })
    expect(singleResult).toMatchObject({
      mode: 'resale-single',
      accompanimentPrice: null,
      suggestedAccompanimentPrice: 8.25,
    })

    const byBrandResult = await useCase.execute({
      actor,
      productId: accompanimentResaleByBrand.id,
    })
    expect(byBrandResult).toMatchObject({
      mode: 'resale-by-brand',
      accompanimentPrice: null,
      suggestedAccompanimentPrice: 14.75,
    })
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
  })

  it('keeps a saved zero Accompaniment price distinct from an unset suggestion', async () => {
    const result = await useCase.execute({
      actor,
      productId: savedFreeAccompaniment.id,
    })

    expect(result).toMatchObject({
      accompanimentPrice: 0,
      suggestedAccompanimentPrice: null,
      mode: 'resale-single',
    })
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('preserves a saved positive Accompaniment price instead of showing a new suggestion', async () => {
    const savedPriceProduct = ProductFaker.fake({
      ...accompanimentResaleSingle,
      id: 'saved-price-accompaniment',
      accompanimentPrice: 4.5,
    })
    scope.productsRepository.findById.mockResolvedValue(savedPriceProduct)

    const result = await useCase.execute({
      actor,
      productId: savedPriceProduct.id,
    })

    expect(result).toMatchObject({
      product: savedPriceProduct,
      accompanimentPrice: 4.5,
      suggestedAccompanimentPrice: null,
    })
    expect(
      scope.resaleConfigurationsRepository.findByProductAndBrand,
    ).toHaveBeenCalledWith(establishmentId, savedPriceProduct.id)
  })

  it('does not suggest an unowned or invalid Single Resale price', async () => {
    const invalidConfigurations = [
      ResaleConfigurationFaker.fake({
        ...accompanimentSingleConfiguration,
        establishmentId: 'another-establishment',
      }),
      ResaleConfigurationFaker.fake({
        ...accompanimentSingleConfiguration,
        productId: 'another-product',
      }),
      ResaleConfigurationFaker.fake({
        ...accompanimentSingleConfiguration,
        brandId: 'unexpected-brand',
      }),
      ResaleConfigurationFaker.fake({
        ...accompanimentSingleConfiguration,
        price: Number.NaN,
      }),
      ResaleConfigurationFaker.fake({
        ...accompanimentSingleConfiguration,
        price: -1,
      }),
    ]

    for (const configuration of invalidConfigurations) {
      scope.resaleConfigurationsRepository.findByProductAndBrand.mockResolvedValue(
        configuration,
      )
      const result = await useCase.execute({
        actor,
        productId: accompanimentResaleSingle.id,
      })

      expect(result.suggestedAccompanimentPrice).toBeNull()
    }
  })

  it('requires a primary owned brand price before suggesting a By-brand price', async () => {
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      { ...accompanimentMainBrand, isPrimary: false },
    ])
    const missingPrimaryResult = await useCase.execute({
      actor,
      productId: accompanimentResaleByBrand.id,
    })
    expect(missingPrimaryResult.suggestedAccompanimentPrice).toBeNull()

    scope.brandsRepository.findManyByProductId.mockResolvedValue([accompanimentMainBrand])
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([
      ResaleConfigurationFaker.fake({
        ...accompanimentByBrandConfiguration,
        establishmentId: 'another-establishment',
      }),
    ])
    const unownedPriceResult = await useCase.execute({
      actor,
      productId: accompanimentResaleByBrand.id,
    })

    expect(unownedPriceResult.suggestedAccompanimentPrice).toBeNull()
  })

  it('allows Operators and hides foreign or unsupported products', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: portion.id,
      }),
    ).resolves.toMatchObject({ product: { id: portion.id } })

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: 'foreign-product' }),
    ).rejects.toBeInstanceOf(NotFoundError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'foreign-product',
        establishmentId: 'another-establishment',
        categories: [ProductCategory.Portion],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'foreign-product' }),
    ).rejects.toBeInstanceOf(NotFoundError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'ingredient-1',
        establishmentId,
        categories: [ProductCategory.Ingredient],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'ingredient-1' }),
    ).rejects.toBeInstanceOf(BadRequestError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'unsupported-stock-control',
        establishmentId,
        categories: [ProductCategory.Resale],
        stockControl: 'unsupported' as ProductStockControl,
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'unsupported-stock-control' }),
    ).rejects.toBeInstanceOf(BadRequestError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'incompatible-categories',
        establishmentId,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'incompatible-categories' }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: 'unknown' as UserProfile },
        productId: portion.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
