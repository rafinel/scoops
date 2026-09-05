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
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
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

    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )

      this.validateProduct(product, request.actor.establishmentId)

      return GetProductPricingUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
      )
    })
  }

  static async buildDetails(
    scope: MrpDatabaseScope,
    establishmentId: string,
    product: Product,
  ): Promise<ProductPricingDetails> {
    if (product.categories.includes(ProductCategory.Portion)) {
      return GetProductPricingUseCase.buildPortionDetails(scope, establishmentId, product)
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
    scope: MrpDatabaseScope,
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
    }
  }

  private static async buildSingleResaleDetails(
    scope: MrpDatabaseScope,
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
    }
  }

  private static async buildByBrandResaleDetails(
    scope: MrpDatabaseScope,
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
    }
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
    scope: MrpDatabaseScope,
    establishmentId: string,
    product: Product,
  ): Promise<number | undefined> {
    if (
      product.currentUnitCost !== undefined &&
      Number.isFinite(product.currentUnitCost) &&
      product.currentUnitCost >= 0
    ) {
      return product.currentUnitCost
    }

    const recipe = await scope.recipesRepository.findByProductId(
      establishmentId,
      product.id,
    )
    if (
      !recipe ||
      recipe.establishmentId !== establishmentId ||
      recipe.productId !== product.id ||
      !Number.isFinite(recipe.yieldQuantity) ||
      recipe.yieldQuantity <= 0
    ) {
      return undefined
    }

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

    return totalCost / recipe.yieldQuantity
  }

  private static async resolveIngredientUnitCost(
    scope: MrpDatabaseScope,
    product: Product | undefined,
    establishmentId: string,
    selectedBrandId?: string,
  ): Promise<number | undefined> {
    if (
      !product ||
      product.establishmentId !== establishmentId ||
      product.status !== 'active' ||
      !product.categories.includes(ProductCategory.Ingredient)
    ) {
      return undefined
    }

    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost !== undefined &&
        Number.isFinite(product.currentUnitCost) &&
        product.currentUnitCost >= 0
        ? product.currentUnitCost
        : undefined
    }

    if (product.stockControl !== ProductStockControl.ByBrand) return undefined

    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const brand =
      (selectedBrandId
        ? brands.find((candidate) => candidate.id === selectedBrandId)
        : undefined) ?? brands.find((candidate) => candidate.isPrimary)
    if (!brand || brand.packageQuantity <= 0) return undefined

    const unitCost = brand.packagePrice / brand.packageQuantity
    return Number.isFinite(unitCost) && unitCost >= 0 ? unitCost : undefined
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
    if (actor.profile !== UserProfile.Manager) {
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
      !product.categories.includes(ProductCategory.Resale)
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
