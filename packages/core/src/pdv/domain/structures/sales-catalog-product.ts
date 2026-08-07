import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { SalesCatalogBrand } from '#pdv/domain/structures/sales-catalog-brand.ts'
import type { SalesCatalogSize } from '#pdv/domain/structures/sales-catalog-size.ts'

export type SalesCatalogProduct = {
  readonly productId: string
  readonly name: string
  readonly stockControl: ProductStockControl
  readonly isActive: boolean
  readonly isAvailable: boolean
  readonly sizes: readonly SalesCatalogSize[]
  readonly resalePrice?: number
  readonly resaleBrands: readonly SalesCatalogBrand[]
}
