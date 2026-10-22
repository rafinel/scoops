import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

export type AccompanimentCostSourceInput = {
  readonly product: Product
  readonly brands: readonly Brand[]
  readonly quantityPerPortion: number
}

type CostSource = {
  readonly brandId?: string
  readonly brandName?: string
  readonly unitCost: number
}

export class AccompanimentCostSourceStrategy
  implements
    BusinessRuleStrategy<
      AccompanimentCostSourceInput,
      Pick<
        ProductAccompanimentDetails,
        'brandId' | 'brandName' | 'unitCost' | 'estimatedCost'
      >
    >
{
  execute({ product, brands, quantityPerPortion }: AccompanimentCostSourceInput) {
    const source = this.resolveSource(product, brands)
    if (!source) return {}
    return {
      ...(source.brandId ? { brandId: source.brandId } : {}),
      ...(source.brandName ? { brandName: source.brandName } : {}),
      unitCost: source.unitCost,
      estimatedCost: quantityPerPortion * source.unitCost,
    }
  }

  private resolveSource(
    product: Product,
    brands: readonly Brand[],
  ): CostSource | undefined {
    if (
      product.status !== ProductStatus.Active ||
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      return undefined
    }
    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost === undefined
        ? undefined
        : { unitCost: product.currentUnitCost }
    }
    return this.resolveMainBrandSource(product, brands)
  }

  private resolveMainBrandSource(
    product: Product,
    brands: readonly Brand[],
  ): CostSource | undefined {
    const mainBrand = brands.find(
      (brand) => brand.productId === product.id && brand.isPrimary,
    )
    if (!mainBrand || mainBrand.packageQuantity <= 0) return undefined
    return {
      brandId: mainBrand.id,
      brandName: mainBrand.name,
      unitCost: mainBrand.packagePrice / mainBrand.packageQuantity,
    }
  }
}
