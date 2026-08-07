import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { SalesCatalogListParams } from '#pdv/domain/structures/sales-catalog-list-params.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'

export interface SalesCatalogProvider {
  findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<SalesCatalogProduct | undefined>
  findMany(
    input: SalesCatalogListParams,
  ): Promise<PaginationResponse<SalesCatalogProduct>>
}
