import type { ProductCreate } from '@scoops/core/mrp/domain/structures'
import type {
  BrandsRepository,
  ProductsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import { AppError } from '@scoops/core/shared/domain/errors'
import { Inject, Injectable } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'

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

export type MrpSeed = {
  products: MrpProductSeed[]
  brands: MrpBrandSeed[]
  stockBalances: MrpStockBalanceSeed[]
}

@Injectable()
export class MrpSeeder {
  constructor(
    @Inject(MRP_REPOSITORIES.products)
    private readonly productsRepository: ProductsRepository,
    @Inject(MRP_REPOSITORIES.brands)
    private readonly brandsRepository: BrandsRepository,
    @Inject(MRP_REPOSITORIES.stockBalances)
    private readonly stockBalancesRepository: StockBalancesRepository,
  ) {}

  async clear(): Promise<void> {
    await this.productsRepository.removeAll()
  }

  async run(seed: MrpSeed | MrpProductSeed[] = []): Promise<void> {
    const { products, brands, stockBalances } = Array.isArray(seed)
      ? { products: seed, brands: [], stockBalances: [] }
      : seed

    const createdProducts = await this.productsRepository.addMany(
      products.map(({ initialStock: _initialStock, ...product }) => product),
    )
    const productIdsByName = new Map(
      createdProducts.map((product) => [product.name, product.id]),
    )
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
  }

  private getBrandKey(productId: string, brandName: string): string {
    return `${productId}:${brandName.toLocaleLowerCase()}`
  }
}
