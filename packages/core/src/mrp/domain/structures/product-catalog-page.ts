import type { ProductCatalogKpis } from '#mrp/domain/structures/product-catalog-kpis.ts'
import type { ProductCatalogRow } from '#mrp/domain/structures/product-catalog-row.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

export type ProductCatalogPage = PaginationResponse<ProductCatalogRow> & {
  readonly kpis: ProductCatalogKpis
}
