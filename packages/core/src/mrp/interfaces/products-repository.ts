import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from '#mrp/domain/entities/product.ts'
import type { ProductListParams } from '#mrp/domain/structures/product-list-params.ts'

export interface ProductsRepository {
  add(input: ProductCreate): Promise<Product>
  findById(productId: string): Promise<Product | undefined>
  findByName(establishmentId: string, name: string): Promise<Product | undefined>
  findMany(input: ProductListParams): Promise<PaginationResponse<Product>>
  replace(productId: string, changes: ProductUpdate): Promise<Product>
  remove(productId: string): Promise<void>
}
