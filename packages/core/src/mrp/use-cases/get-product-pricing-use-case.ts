import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import {
  ProductCategory,
  ProductStockControl,
  type ProductPricingDetails,
  type ProductSizePricing,
  type ResalePricing,
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
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class GetProductPricingUseCase implements UseCase<Request, ProductPricingDetails> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductPricingDetails> {
    this.validateActor(request.actor)

    return this.database.run(
      async ({
        productsRepository,
        brandsRepository,
        recipesRepository,
        recipeIngredientsRepository,
        productionsRepository,
        productionIngredientsRepository,
        stockBalancesRepository,
        stockTransactionsRepository,
        productSizesRepository,
        accompanimentTypesRepository,
        productAccompanimentsRepository,
        resaleConfigurationsRepository,
        eventsRepository,
      }: MrpDatabaseRepositories) => {
        const scope = {
          productsRepository,
          brandsRepository,
          recipesRepository,
          recipeIngredientsRepository,
          productionsRepository,
          productionIngredientsRepository,
          stockBalancesRepository,
          stockTransactionsRepository,
          productSizesRepository,
          accompanimentTypesRepository,
          productAccompanimentsRepository,
          resaleConfigurationsRepository,
          eventsRepository,
        }
        const product = await productsRepository.findById(
          request.actor.establishmentId,
          request.productId,
        )

        this.validateProduct(product, request.actor.establishmentId)

        return GetProductPricingUseCase.buildDetails(
          scope,
          request.actor.establishmentId,
          product,
        )
      },
    )
  }

  static async buildDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductPricingDetails> {
    if (product.categories.includes(ProductCategory.Portion)) {
      return GetProductPricingUseCase.buildPortionDetails(scope, establishmentId, product)
    }

    if (
      product.categories.includes(ProductCategory.Accompaniment) &&
      !product.categories.includes(ProductCategory.Resale)
    ) {
      return {
        product,
        mode: 'accompaniment',
        sizes: [],
        resale: [],
        ...(await GetProductPricingUseCase.getAccompanimentPriceProjection(
          scope,
          establishmentId,
          product,
        )),
      }
    }

    if (!product.categories.includes(ProductCategory.Resale)) {
      throw new BadRequestError('O produto não possui uma categoria com preços.')
    }

    if (product.stockControl === ProductStockControl.Single) {
      return GetProductPricingUseCase.buildSingleResaleDetails(
        scope,
        establishmentId,
        product,
      )
    }

    if (product.stockControl === ProductStockControl.ByBrand) {
      return GetProductPricingUseCase.buildByBrandResaleDetails(
        scope,
        establishmentId,
        product,
      )
    }

    throw new BadRequestError('O controle de estoque do produto não é suportado.')
  }

  private static async buildPortionDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductPricingDetails> {
    const sizes = await scope.productSizesRepository.findManyByProductId(
      establishmentId,
      product.id,
    )
    for (const size of sizes) {
      if (size.establishmentId !== establishmentId || size.productId !== product.id) {
        throw new NotFoundError('Tamanho não encontrado.')
      }
    }
    const unitCost = await GetProductPricingUseCase.resolveUnitCost(
      scope,
      establishmentId,
      product,
    )

    return {
      product,
      mode: 'portion',
      sizes: sizes.map((size) =>
        GetProductPricingUseCase.buildSizePricing(size, unitCost),
      ),
      resale: [],
      ...(await GetProductPricingUseCase.getAccompanimentPriceProjection(
        scope,
        establishmentId,
        product,
      )),
    }
  }

  private static async buildSingleResaleDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductPricingDetails> {
    const configuration =
      await scope.resaleConfigurationsRepository.findByProductAndBrand(
        establishmentId,
        product.id,
      )
    const ownedConfiguration = GetProductPricingUseCase.isOwnedConfiguration(
      configuration,
      establishmentId,
      product.id,
      undefined,
    )
      ? configuration
      : undefined

    return {
      product,
      mode: 'resale-single',
      sizes: [],
      resale: [
        GetProductPricingUseCase.buildResalePricing(ownedConfiguration, undefined, 1),
      ],
      ...(await GetProductPricingUseCase.getAccompanimentPriceProjection(
        scope,
        establishmentId,
        product,
      )),
    }
  }

  private static async buildByBrandResaleDetails(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<ProductPricingDetails> {
    const [brands, configurations] = await Promise.all([
      scope.brandsRepository.findManyByProductId(product.id),
      scope.resaleConfigurationsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
    ])

    return {
      product,
      mode: 'resale-by-brand',
      sizes: [],
      resale: brands.map((brand) => {
        const configuration = configurations.find(
          (candidate) =>
            candidate.brandId === brand.id &&
            GetProductPricingUseCase.isOwnedConfiguration(
              candidate,
              establishmentId,
              product.id,
              brand.id,
            ),
        )
        return GetProductPricingUseCase.buildResalePricing(
          configuration,
          brand,
          brand.packageQuantity,
        )
      }),
      ...(await GetProductPricingUseCase.getAccompanimentPriceProjection(
        scope,
        establishmentId,
        product,
      )),
    }
  }

  private static async getAccompanimentPriceProjection(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<
    Pick<ProductPricingDetails, 'accompanimentPrice' | 'suggestedAccompanimentPrice'>
  > {
    const isAccompaniment = product.categories.includes(ProductCategory.Accompaniment)
    const accompanimentPrice = isAccompaniment
      ? (product.accompanimentPrice ?? null)
      : null
    const suggestedAccompanimentPrice =
      isAccompaniment &&
      accompanimentPrice === null &&
      product.categories.includes(ProductCategory.Resale)
        ? await GetProductPricingUseCase.findResalePriceSuggestion(
            scope,
            establishmentId,
            product,
          )
        : null

    return { accompanimentPrice, suggestedAccompanimentPrice }
  }

  private static async findResalePriceSuggestion(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<number | null> {
    if (product.stockControl === ProductStockControl.Single) {
      const configuration =
        await scope.resaleConfigurationsRepository.findByProductAndBrand(
          establishmentId,
          product.id,
        )
      if (
        GetProductPricingUseCase.isOwnedConfiguration(
          configuration,
          establishmentId,
          product.id,
          undefined,
        ) &&
        Number.isFinite(configuration.price) &&
        configuration.price >= 0
      ) {
        return configuration.price
      }
      return null
    }

    if (product.stockControl !== ProductStockControl.ByBrand) return null

    const [brands, configurations] = await Promise.all([
      scope.brandsRepository.findManyByProductId(product.id),
      scope.resaleConfigurationsRepository.findManyByProductId(
        establishmentId,
        product.id,
      ),
    ])
    const primaryBrand = brands.find(
      (brand) => brand.productId === product.id && brand.isPrimary,
    )
    if (!primaryBrand) return null

    const configuration = configurations.find(
      (candidate) =>
        candidate.brandId === primaryBrand.id &&
        GetProductPricingUseCase.isOwnedConfiguration(
          candidate,
          establishmentId,
          product.id,
          primaryBrand.id,
        ),
    )
    return configuration &&
      Number.isFinite(configuration.price) &&
      configuration.price >= 0
      ? configuration.price
      : null
  }

  private static buildSizePricing(
    size: ProductSize,
    unitCost: number | undefined,
  ): ProductSizePricing {
    if (unitCost === undefined) return { size }

    const operatingCost = unitCost * size.quantity
    const profit = size.price - operatingCost

    return {
      size,
      operatingCost,
      profit,
      ...(size.price === 0 ? {} : { marginPercentage: (profit / size.price) * 100 }),
    }
  }

  private static buildResalePricing(
    configuration: ResaleConfiguration | undefined,
    brand: Brand | undefined,
    packageQuantity: number,
  ): ResalePricing {
    return {
      ...(configuration ? { configuration, price: configuration.price } : {}),
      ...(brand ? { brand } : {}),
      packageQuantity,
      isActive: configuration?.isActive ?? false,
    }
  }

  private static async resolveUnitCost(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    product: Product,
  ): Promise<number | undefined> {
    if (GetProductPricingUseCase.isValidUnitCost(product.currentUnitCost)) {
      return product.currentUnitCost
    }

    const recipe = await GetProductPricingUseCase.findOwnedRecipe(
      scope,
      establishmentId,
      product.id,
    )
    if (!recipe) return undefined

    const totalCost = await GetProductPricingUseCase.calculateRecipeCost(
      scope,
      establishmentId,
      recipe,
    )
    return totalCost === undefined ? undefined : totalCost / recipe.yieldQuantity
  }

  private static async findOwnedRecipe(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productId: string,
  ) {
    const recipe = await scope.recipesRepository.findByProductId(
      establishmentId,
      productId,
    )
    if (
      !recipe ||
      recipe.establishmentId !== establishmentId ||
      recipe.productId !== productId ||
      !Number.isFinite(recipe.yieldQuantity) ||
      recipe.yieldQuantity <= 0
    ) {
      return undefined
    }
    return recipe
  }

  private static async calculateRecipeCost(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    recipe: NonNullable<
      Awaited<ReturnType<typeof GetProductPricingUseCase.findOwnedRecipe>>
    >,
  ): Promise<number | undefined> {
    const ingredients = await scope.recipeIngredientsRepository.findByRecipeId(
      establishmentId,
      recipe.id,
    )
    let totalCost = 0

    for (const ingredient of ingredients) {
      if (
        ingredient.establishmentId !== establishmentId ||
        ingredient.recipeId !== recipe.id ||
        !Number.isFinite(ingredient.quantity) ||
        ingredient.quantity < 0
      ) {
        return undefined
      }

      const ingredientProduct = await scope.productsRepository.findById(
        establishmentId,
        ingredient.ingredientProductId,
      )
      const ingredientUnitCost = await GetProductPricingUseCase.resolveIngredientUnitCost(
        scope,
        ingredientProduct,
        establishmentId,
        ingredient.ingredientBrandId,
      )
      if (ingredientUnitCost === undefined) return undefined
      totalCost += ingredient.quantity * ingredientUnitCost
    }

    return totalCost
  }

  private static isValidUnitCost(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value) && value >= 0
  }

  private static async resolveIngredientUnitCost(
    scope: MrpDatabaseRepositories,
    product: Product | undefined,
    establishmentId: string,
    selectedBrandId?: string,
  ): Promise<number | undefined> {
    if (!GetProductPricingUseCase.isEligibleIngredient(product, establishmentId)) {
      return undefined
    }

    if (product.stockControl === ProductStockControl.Single) {
      return GetProductPricingUseCase.isValidUnitCost(product.currentUnitCost)
        ? product.currentUnitCost
        : undefined
    }

    if (product.stockControl !== ProductStockControl.ByBrand) return undefined

    return GetProductPricingUseCase.resolveBrandUnitCost(scope, product, selectedBrandId)
  }

  private static isEligibleIngredient(
    product: Product | undefined,
    establishmentId: string,
  ): product is Product {
    return Boolean(
      product &&
        product.establishmentId === establishmentId &&
        product.status === 'active' &&
        product.categories.includes(ProductCategory.Ingredient),
    )
  }

  private static async resolveBrandUnitCost(
    scope: MrpDatabaseRepositories,
    product: Product,
    selectedBrandId?: string,
  ): Promise<number | undefined> {
    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand =
      (selectedBrandId
        ? brands.find((candidate) => candidate.id === selectedBrandId)
        : undefined) ?? brands.find((candidate) => candidate.isPrimary)
    if (!brand || brand.packageQuantity <= 0) return undefined

    const unitCost = brand.packagePrice / brand.packageQuantity
    return GetProductPricingUseCase.isValidUnitCost(unitCost) ? unitCost : undefined
  }

  private static isOwnedConfiguration(
    configuration: ResaleConfiguration | undefined,
    establishmentId: string,
    productId: string,
    brandId: string | undefined,
  ): configuration is ResaleConfiguration {
    return Boolean(
      configuration &&
        configuration.establishmentId === establishmentId &&
        configuration.productId === productId &&
        configuration.brandId === brandId,
    )
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator) {
      throw new AuthorizationError('Somente gestores podem consultar preços.')
    }
  }

  private validateProduct(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (
      !product.categories.includes(ProductCategory.Portion) &&
      !product.categories.includes(ProductCategory.Resale) &&
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      throw new BadRequestError('O produto não possui uma categoria com preços.')
    }
    if (
      product.categories.includes(ProductCategory.Portion) &&
      product.categories.includes(ProductCategory.Resale)
    ) {
      throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
    }
  }
}
