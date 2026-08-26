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
    const {
      accompanimentTypes,
      products,
      brands,
      stockBalances,
      productSizes,
      productAccompaniments,
      resaleConfigurations,
    } = Array.isArray(seed)
      ? {
          accompanimentTypes: [],
          products: seed,
          brands: [],
          stockBalances: [],
          productSizes: [],
          productAccompaniments: [],
          resaleConfigurations: [],
        }
      : seed

    const createdAccompanimentTypes = await Promise.all(
      accompanimentTypes.map((type) => this.accompanimentTypesRepository.add(type)),
    )
    const accompanimentTypeIdsByName = new Map(
      createdAccompanimentTypes.map((type) => [type.name, type.id]),
    )

    const createdProducts = await this.productsRepository.addMany(
      products.map(({ initialStock: _initialStock, ...product }) => product),
    )
    const productIdsByName = new Map(
      createdProducts.map((product) => [product.name, product.id]),
    )
    for (const sizeSeed of productSizes) {
      const resolvedProductId =
        sizeSeed.productId ??
        (sizeSeed.productName ? productIdsByName.get(sizeSeed.productName) : undefined)
      if (!resolvedProductId) {
        throw new AppError(
          `O produto do tamanho seed ${sizeSeed.name} não foi encontrado.`,
          'Seed MRP inválido',
        )
      }

      const product = createdProducts.find(({ id }) => id === resolvedProductId)
      if (!product) {
        throw new AppError(
          `O produto do tamanho seed ${sizeSeed.name} não foi criado nesta seed.`,
          'Seed MRP inválido',
        )
      }

      await this.productSizesRepository.add({
        establishmentId: product.establishmentId,
        productId: resolvedProductId,
        name: sizeSeed.name,
        quantity: sizeSeed.quantity,
        price: sizeSeed.price,
        isActive: sizeSeed.isActive,
      })
    }
    for (const [index, product] of createdProducts.entries()) {
      const initialStock = products[index]?.initialStock
      if (initialStock === undefined || initialStock <= 0) continue

      await this.stockBalancesRepository.initialize(product.id)
      await this.stockBalancesRepository.add({ productId: product.id }, initialStock)
    }
    const brandIdsByProductAndName = new Map<string, string>()
    for (const brandSeed of brands) {
      const { productId, productName, initialStock, ...brand } = brandSeed
      const resolvedProductId =
        productId ?? (productName ? productIdsByName.get(productName) : undefined)
      if (!resolvedProductId) {
        throw new AppError(
          `O produto da marca seed ${brand.name} não foi encontrado.`,
          'Seed MRP inválido',
        )
      }

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
    for (const stockBalance of stockBalances) {
      const resolvedProductId =
        stockBalance.productId ??
        (stockBalance.productName
          ? productIdsByName.get(stockBalance.productName)
          : undefined)
      if (!resolvedProductId) {
        throw new AppError(
          'O produto da balança seed não foi encontrado.',
          'Seed MRP inválido',
        )
      }

      const resolvedBrandId =
        stockBalance.brandId ??
        (stockBalance.brandName
          ? brandIdsByProductAndName.get(
              this.getBrandKey(resolvedProductId, stockBalance.brandName),
            )
          : undefined)
      if (stockBalance.brandName && !resolvedBrandId) {
        throw new AppError(
          'A marca da balança seed não foi encontrada.',
          'Seed MRP inválido',
        )
      }

      const target = {
        productId: resolvedProductId,
        brandId: resolvedBrandId,
      }
      await this.stockBalancesRepository.initialize(target.productId, target.brandId)
      if (stockBalance.quantity !== 0) {
        await this.stockBalancesRepository.add(target, stockBalance.quantity)
      }
    }

    for (const resaleConfiguration of resaleConfigurations) {
      const resolvedProductId =
        resaleConfiguration.productId ??
        (resaleConfiguration.productName
          ? productIdsByName.get(resaleConfiguration.productName)
          : undefined)
      if (!resolvedProductId) {
        throw new AppError(
          'O produto da configuração de revenda seed não foi encontrado.',
          'Seed MRP inválido',
        )
      }

      const product = createdProducts.find(({ id }) => id === resolvedProductId)
      if (!product) {
        throw new AppError(
          'A configuração de revenda seed referencia um produto que não foi criado nesta seed.',
          'Seed MRP inválido',
        )
      }

      const resolvedBrandId =
        resaleConfiguration.brandId ??
        (resaleConfiguration.brandName
          ? brandIdsByProductAndName.get(
              this.getBrandKey(resolvedProductId, resaleConfiguration.brandName),
            )
          : undefined)
      if (resaleConfiguration.brandName && !resolvedBrandId) {
        throw new AppError(
          'A marca da configuração de revenda seed não foi encontrada.',
          'Seed MRP inválido',
        )
      }
      if (
        product.stockControl === ProductStockControl.Single &&
        resolvedBrandId !== undefined
      ) {
        throw new AppError(
          'O produto de estoque único não pode ter marca na configuração de revenda seed.',
          'Seed MRP inválido',
        )
      }
      if (
        product.stockControl === ProductStockControl.ByBrand &&
        resolvedBrandId === undefined
      ) {
        throw new AppError(
          'Informe a marca da configuração de revenda seed para produtos por marca.',
          'Seed MRP inválido',
        )
      }

      await this.resaleConfigurationsRepository.add({
        establishmentId: product.establishmentId,
        productId: resolvedProductId,
        ...(resolvedBrandId ? { brandId: resolvedBrandId } : {}),
        price: resaleConfiguration.price,
        isActive: resaleConfiguration.isActive,
      })
    }

    for (const accompanimentSeed of productAccompaniments) {
      const productId = productIdsByName.get(accompanimentSeed.productName)
      const accompanimentProductId = productIdsByName.get(
        accompanimentSeed.accompanimentProductName,
      )
      const accompanimentTypeId = accompanimentTypeIdsByName.get(
        accompanimentSeed.accompanimentTypeName,
      )
      if (!productId) {
        throw new AppError(
          `A porção seed ${accompanimentSeed.productName} não foi encontrada.`,
          'Seed MRP inválido',
        )
      }
      if (!accompanimentProductId) {
        throw new AppError(
          `O acompanhamento seed ${accompanimentSeed.accompanimentProductName} não foi encontrado.`,
          'Seed MRP inválido',
        )
      }
      if (!accompanimentTypeId) {
        throw new AppError(
          `O tipo de acompanhamento seed ${accompanimentSeed.accompanimentTypeName} não foi encontrado.`,
          'Seed MRP inválido',
        )
      }

      const product = createdProducts.find(({ id }) => id === productId)
      if (!product) {
        throw new AppError(
          `A porção seed ${accompanimentSeed.productName} não foi criada nesta seed.`,
          'Seed MRP inválido',
        )
      }

      await this.productAccompanimentsRepository.add({
        establishmentId: product.establishmentId,
        productId,
        accompanimentProductId,
        accompanimentTypeId,
        quantityPerPortion: accompanimentSeed.quantityPerPortion,
      })
    }
  }

  private getBrandKey(productId: string, brandName: string): string {
    return `${productId}:${brandName.toLocaleLowerCase()}`
  }
}
