import type { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'

type SalesCatalogQuery = {
  readonly establishmentId: string
  readonly search?: string
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
  /**
   * Returns every active Portion/Resale product of the establishment that matches the
   * optional name search and kind, ordered by name and then product id. Products are not
   * filtered by sale eligibility and the result is not paginated.
   */
  findAllMatching(input: SalesCatalogQuery): Promise<readonly SalesCatalogProduct[]>
}
