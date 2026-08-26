import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { SalesCatalogListParams } from '#pdv/domain/structures/sales-catalog-list-params.ts'
import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'

type SalesCatalogQuery = SalesCatalogListParams & {
  readonly kind?: SaleItemKind
}

export interface SalesCatalogProvider {
  findProductIdsByName(
    establishmentId: string,
    search: string,
  ): Promise<readonly string[]>
  findByProductIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly SalesCatalogProduct[]>
  findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<SalesCatalogProduct | undefined>
  findMany(input: SalesCatalogQuery): Promise<PaginationResponse<SalesCatalogProduct>>
}
