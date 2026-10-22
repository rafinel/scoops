import type { ProductSalesConfigurationSource } from '#mrp/domain/structures/product-sales-configuration-source.ts'

export interface ProductSalesConfigurationSourcesRepository {
  findManyByProductIds(
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<readonly ProductSalesConfigurationSource[]>
}
