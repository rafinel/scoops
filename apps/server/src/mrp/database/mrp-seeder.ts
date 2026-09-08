import type {
  AccompanimentTypeCreate,
  ProductCreate,
} from '@scoops/core/mrp/domain/structures'
import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductSizesRepository,
  ProductionIngredientsRepository,
  ProductionsRepository,
  ProductsRepository,
  RecipeIngredientsRepository,
  RecipesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
  StockTransactionsRepository,
} from '@scoops/core/mrp/interfaces'
import { AppError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'

type MrpProductSeed = ProductCreate & {
  initialStock?: number
}

type MrpBrandSeed = {
  productId?: string
  productName?: string
  name: string
  packageQuantity: number
  packagePrice: number
  isPrimary: boolean
  initialStock?: number
}

type MrpStockBalanceSeed = {
  productId?: string
  productName?: string
  brandId?: string
  brandName?: string
  quantity: number
}

type MrpProductSizeSeed = {
  productId?: string
  productName?: string
  name: string
  quantity: number
  price: number
  isActive: boolean
}

type MrpProductAccompanimentSeed = {
  productName: string
  accompanimentProductName: string
  accompanimentTypeName: string
  quantityPerPortion: number
}

type MrpResaleConfigurationSeed = {
  productId?: string
  productName?: string
  brandId?: string
  brandName?: string
  price: number
  isActive: boolean
}

export type MrpSeed = {
  accompanimentTypes: AccompanimentTypeCreate[]
  products: MrpProductSeed[]
  brands: MrpBrandSeed[]
  stockBalances: MrpStockBalanceSeed[]
  productSizes: MrpProductSizeSeed[]
  productAccompaniments: MrpProductAccompanimentSeed[]
  resaleConfigurations: MrpResaleConfigurationSeed[]
}

@Injectable()
export class MrpSeeder {
  constructor(
    @Inject(MRP_REPOSITORIES.productAccompaniments)
    private readonly productAccompanimentsRepository: ProductAccompanimentsRepository,
    @Inject(MRP_REPOSITORIES.productionIngredients)
    private readonly productionIngredientsRepository: ProductionIngredientsRepository,
    @Inject(MRP_STOCK_TRANSACTIONS_REPOSITORY)
    private readonly stockTransactionsRepository: StockTransactionsRepository,
    @Inject(MRP_REPOSITORIES.productions)
    private readonly productionsRepository: ProductionsRepository,
    @Inject(MRP_REPOSITORIES.recipeIngredients)
    private readonly recipeIngredientsRepository: RecipeIngredientsRepository,
    @Inject(MRP_REPOSITORIES.recipes)
    private readonly recipesRepository: RecipesRepository,
    @Inject(MRP_REPOSITORIES.resaleConfigurations)
    private readonly resaleConfigurationsRepository: ResaleConfigurationsRepository,
    @Inject(MRP_REPOSITORIES.productSizes)
    private readonly productSizesRepository: ProductSizesRepository,
    @Inject(MRP_REPOSITORIES.stockBalances)
    private readonly stockBalancesRepository: StockBalancesRepository,
    @Inject(MRP_REPOSITORIES.brands)
    private readonly brandsRepository: BrandsRepository,
    @Inject(MRP_REPOSITORIES.products)
    private readonly productsRepository: ProductsRepository,
    @Inject(MRP_REPOSITORIES.accompanimentTypes)
    private readonly accompanimentTypesRepository: AccompanimentTypesRepository,
  ) {}

  async clear(): Promise<void> {
    // Delete dependent rows first because some MRP foreign keys use RESTRICT.
    await this.productAccompanimentsRepository.removeAll()
    await this.productionIngredientsRepository.removeAll()
    await this.stockTransactionsRepository.removeAll()
    await this.productionsRepository.removeAll()
    await this.recipeIngredientsRepository.removeAll()
    await this.recipesRepository.removeAll()
    await this.resaleConfigurationsRepository.removeAll()
    await this.productSizesRepository.removeAll()
    await this.stockBalancesRepository.removeAll()
    await this.brandsRepository.removeAll()
    await this.productsRepository.removeAll()
    await this.accompanimentTypesRepository.removeAll()
  }

  async run(seed: MrpSeed | MrpProductSeed[] = []): Promise<void> {
    const normalizedSeed = this.normalizeSeed(seed)
    const accompanimentTypeIdsByName = await this.addAccompanimentTypes(
      normalizedSeed.accompanimentTypes,
    )
    const { createdProducts, productIdsByName } = await this.addProducts(
      normalizedSeed.products,
    )

    await this.addProductSizes(
      normalizedSeed.productSizes,
      createdProducts,
      productIdsByName,
    )
    await this.addInitialProductStock(normalizedSeed.products, createdProducts)

    const brandIdsByProductAndName = await this.addBrands(
      normalizedSeed.brands,
      productIdsByName,
    )
    await this.addStockBalances(
      normalizedSeed.stockBalances,
      productIdsByName,
      brandIdsByProductAndName,
    )
    await this.addResaleConfigurations(
      normalizedSeed.resaleConfigurations,
      createdProducts,
      productIdsByName,
      brandIdsByProductAndName,
    )
    await this.addProductAccompaniments(
      normalizedSeed.productAccompaniments,
      createdProducts,
      productIdsByName,
      accompanimentTypeIdsByName,
    )
  }

  private normalizeSeed(seed: MrpSeed | MrpProductSeed[]): MrpSeed {
    if (!Array.isArray(seed)) return seed

    return {
      accompanimentTypes: [],
      products: seed,
      brands: [],
      stockBalances: [],
      productSizes: [],
      productAccompaniments: [],
      resaleConfigurations: [],
    }
  }

  private async addAccompanimentTypes(
    accompanimentTypes: AccompanimentTypeCreate[],
  ): Promise<Map<string, string>> {
    const createdTypes = await Promise.all(
      accompanimentTypes.map((type) => this.accompanimentTypesRepository.add(type)),
    )
    return new Map(createdTypes.map((type) => [type.name, type.id]))
  }

  private async addProducts(products: MrpProductSeed[]) {
    const createdProducts = await this.productsRepository.addMany(
      products.map(({ initialStock: _initialStock, ...product }) => product),
    )
    return {
      createdProducts,
      productIdsByName: new Map(
        createdProducts.map((product) => [product.name, product.id]),
      ),
    }
  }

  private async addProductSizes(
    productSizes: MrpProductSizeSeed[],
    createdProducts: Awaited<ReturnType<ProductsRepository['addMany']>>,
    productIdsByName: Map<string, string>,
  ): Promise<void> {
    for (const sizeSeed of productSizes) {
      const productId = this.resolveProductId(
        sizeSeed.productId,
        sizeSeed.productName,
        productIdsByName,
        `O produto do tamanho seed ${sizeSeed.name} não foi encontrado.`,
      )
      const product = this.getCreatedProduct(
        productId,
        createdProducts,
        `O produto do tamanho seed ${sizeSeed.name} não foi criado nesta seed.`,
      )

      await this.productSizesRepository.add({
        establishmentId: product.establishmentId,
        productId,
        name: sizeSeed.name,
        quantity: sizeSeed.quantity,
        price: sizeSeed.price,
        isActive: sizeSeed.isActive,
      })
    }
  }

  private async addInitialProductStock(
    products: MrpProductSeed[],
    createdProducts: Awaited<ReturnType<ProductsRepository['addMany']>>,
  ): Promise<void> {
    for (const [index, product] of createdProducts.entries()) {
      const initialStock = products[index]?.initialStock
      if (initialStock === undefined || initialStock <= 0) continue

      await this.stockBalancesRepository.initialize(product.id)
      await this.stockBalancesRepository.add({ productId: product.id }, initialStock)
    }
  }

  private async addBrands(
    brands: MrpBrandSeed[],
    productIdsByName: Map<string, string>,
  ): Promise<Map<string, string>> {
    const brandIdsByProductAndName = new Map<string, string>()
    for (const brandSeed of brands) {
      const { productId, productName, initialStock, ...brand } = brandSeed
      const resolvedProductId = this.resolveProductId(
        productId,
        productName,
        productIdsByName,
        `O produto da marca seed ${brand.name} não foi encontrado.`,
      )
      const createdBrand = await this.brandsRepository.add({
        ...brand,
        productId: resolvedProductId,
      })
      brandIdsByProductAndName.set(
        this.getBrandKey(resolvedProductId, createdBrand.name),
        createdBrand.id,
      )
      if (initialStock === undefined || initialStock <= 0) continue

      const target = { productId: resolvedProductId, brandId: createdBrand.id }
      await this.stockBalancesRepository.initialize(target.productId, target.brandId)
      await this.stockBalancesRepository.add(target, initialStock)
    }
    return brandIdsByProductAndName
  }

  private async addStockBalances(
    stockBalances: MrpStockBalanceSeed[],
    productIdsByName: Map<string, string>,
    brandIdsByProductAndName: Map<string, string>,
  ): Promise<void> {
    for (const stockBalance of stockBalances) {
      const productId = this.resolveProductId(
        stockBalance.productId,
        stockBalance.productName,
        productIdsByName,
        'O produto da balança seed não foi encontrado.',
      )
      const brandId =
        stockBalance.brandId ??
        this.resolveBrandId(
          productId,
          stockBalance.brandName,
          brandIdsByProductAndName,
          'A marca da balança seed não foi encontrada.',
        )
      const target = { productId, brandId }

      await this.stockBalancesRepository.initialize(target.productId, target.brandId)
      if (stockBalance.quantity !== 0) {
        await this.stockBalancesRepository.add(target, stockBalance.quantity)
      }
    }
  }

  private async addResaleConfigurations(
    resaleConfigurations: MrpResaleConfigurationSeed[],
    createdProducts: Awaited<ReturnType<ProductsRepository['addMany']>>,
    productIdsByName: Map<string, string>,
    brandIdsByProductAndName: Map<string, string>,
  ): Promise<void> {
    for (const resaleConfiguration of resaleConfigurations) {
      const productId = this.resolveProductId(
        resaleConfiguration.productId,
        resaleConfiguration.productName,
        productIdsByName,
        'O produto da configuração de revenda seed não foi encontrado.',
      )
      const product = this.getCreatedProduct(
        productId,
        createdProducts,
        'A configuração de revenda seed referencia um produto que não foi criado nesta seed.',
      )
      const brandId =
        resaleConfiguration.brandId ??
        this.resolveBrandId(
          productId,
          resaleConfiguration.brandName,
          brandIdsByProductAndName,
          'A marca da configuração de revenda seed não foi encontrada.',
        )

      this.validateResaleConfiguration(product.stockControl, brandId)
      await this.resaleConfigurationsRepository.add({
        establishmentId: product.establishmentId,
        productId,
        ...(brandId ? { brandId } : {}),
        price: resaleConfiguration.price,
        isActive: resaleConfiguration.isActive,
      })
    }
  }

  private async addProductAccompaniments(
    productAccompaniments: MrpProductAccompanimentSeed[],
    createdProducts: Awaited<ReturnType<ProductsRepository['addMany']>>,
    productIdsByName: Map<string, string>,
    accompanimentTypeIdsByName: Map<string, string>,
  ): Promise<void> {
    for (const accompanimentSeed of productAccompaniments) {
      const productId = this.resolveNamedId(
        productIdsByName,
        accompanimentSeed.productName,
        `A porção seed ${accompanimentSeed.productName} não foi encontrada.`,
      )
      const accompanimentProductId = this.resolveNamedId(
        productIdsByName,
        accompanimentSeed.accompanimentProductName,
        `O acompanhamento seed ${accompanimentSeed.accompanimentProductName} não foi encontrado.`,
      )
      const accompanimentTypeId = this.resolveNamedId(
        accompanimentTypeIdsByName,
        accompanimentSeed.accompanimentTypeName,
        `O tipo de acompanhamento seed ${accompanimentSeed.accompanimentTypeName} não foi encontrado.`,
      )
      const product = this.getCreatedProduct(
        productId,
        createdProducts,
        `A porção seed ${accompanimentSeed.productName} não foi criada nesta seed.`,
      )

      await this.productAccompanimentsRepository.add({
        establishmentId: product.establishmentId,
        productId,
        accompanimentProductId,
        accompanimentTypeId,
        quantityPerPortion: accompanimentSeed.quantityPerPortion,
      })
    }
  }

  private resolveProductId(
    productId: string | undefined,
    productName: string | undefined,
    productIdsByName: Map<string, string>,
    errorMessage: string,
  ): string {
    if (productId) return productId
    return this.resolveNamedId(productIdsByName, productName, errorMessage)
  }

  private resolveNamedId(
    idsByName: Map<string, string>,
    name: string | undefined,
    errorMessage: string,
  ): string {
    const resolvedId = name ? idsByName.get(name) : undefined
    if (!resolvedId) {
      throw new AppError(errorMessage, 'Seed MRP inválido')
    }
    return resolvedId
  }

  private resolveBrandId(
    productId: string,
    brandName: string | undefined,
    brandIdsByProductAndName: Map<string, string>,
    errorMessage: string,
  ): string | undefined {
    if (!brandName) return undefined
    return this.resolveNamedId(
      brandIdsByProductAndName,
      this.getBrandKey(productId, brandName),
      errorMessage,
    )
  }

  private getCreatedProduct(
    productId: string,
    createdProducts: Awaited<ReturnType<ProductsRepository['addMany']>>,
    errorMessage: string,
  ) {
    const product = createdProducts.find(({ id }) => id === productId)
    if (!product) throw new AppError(errorMessage, 'Seed MRP inválido')
    return product
  }

  private validateResaleConfiguration(
    stockControl: ProductStockControl,
    brandId: string | undefined,
  ): void {
    if (stockControl === ProductStockControl.Single && brandId !== undefined) {
      throw new AppError(
        'O produto de estoque único não pode ter marca na configuração de revenda seed.',
        'Seed MRP inválido',
      )
    }
    if (stockControl === ProductStockControl.ByBrand && brandId === undefined) {
      throw new AppError(
        'Informe a marca da configuração de revenda seed para produtos por marca.',
        'Seed MRP inválido',
      )
    }
  }

  private getBrandKey(productId: string, brandName: string): string {
    return `${productId}:${brandName.toLocaleLowerCase()}`
  }
}
