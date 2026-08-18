import type { Product } from '#mrp/domain/entities/product.ts'
import type {
  ProductCatalogPage,
  ProductListParams,
  RegisterProductInput,
} from '#mrp/domain/structures/index.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface MrpService {
  listProducts(
    input: Omit<ProductListParams, 'establishmentId'>,
  ): Promise<RestResponse<ProductCatalogPage>>
  registerProduct(input: RegisterProductInput): Promise<RestResponse<Product>>
}
