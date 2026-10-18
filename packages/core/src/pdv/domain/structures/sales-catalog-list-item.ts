import type { SalesCatalogAvailability } from '#pdv/domain/structures/sales-catalog-availability.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'

export type SalesCatalogListItem = SalesCatalogProduct & {
  readonly availability: SalesCatalogAvailability
}
