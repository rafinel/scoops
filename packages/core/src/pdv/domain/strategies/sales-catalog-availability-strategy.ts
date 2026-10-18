import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import { SalesCatalogAvailability } from '#pdv/domain/structures/sales-catalog-availability.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

/** Classifies a catalog product as sellable, out of stock or without a valid price. */
export class SalesCatalogAvailabilityStrategy
  implements BusinessRuleStrategy<SalesCatalogProduct, SalesCatalogAvailability>
{
  execute(product: SalesCatalogProduct): SalesCatalogAvailability {
    if (!this.hasValidPrice(product)) return SalesCatalogAvailability.MissingPrice
    if (!product.isAvailable) return SalesCatalogAvailability.OutOfStock

    return SalesCatalogAvailability.Available
  }

  private hasValidPrice(product: SalesCatalogProduct): boolean {
    if (product.kind === SaleItemKind.Portion) return this.hasPricedSize(product)
    if (product.stockControl === ProductStockControl.Single)
      return this.isValidPrice(product.resalePrice)

    return this.hasPricedBrand(product)
  }

  private hasPricedSize(product: SalesCatalogProduct): boolean {
    return product.sizes.some(
      (size) => size.isActive && this.isValidPrice(size.basePrice),
    )
  }

  private hasPricedBrand(product: SalesCatalogProduct): boolean {
    return product.resaleBrands.some(
      (brand) => brand.isActive && this.isValidPrice(brand.basePrice),
    )
  }

  private isValidPrice(price: number | undefined): boolean {
    return price !== undefined && Number.isFinite(price) && price >= 0
  }
}
