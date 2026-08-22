import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductCatalogPage } from '#mrp/domain/structures/product-catalog-page.ts'
import type { ProductCreate } from '#mrp/domain/structures/product-create.ts'
import type { ProductListParams } from '#mrp/domain/structures/product-list-params.ts'
import type { ProductUpdate } from '#mrp/domain/structures/product-update.ts'

export interface ProductsRepository {
  add(input: ProductCreate): Promise<Product>
  addMany(inputs: ProductCreate[]): Promise<readonly Product[]>
  findById(establishmentId: string, productId: string): Promise<Product | undefined>
  findByName(establishmentId: string, name: string): Promise<Product | undefined>
  findMany(input: ProductListParams): Promise<ProductCatalogPage>
  replace(productId: string, changes: ProductUpdate): Promise<Product>
  remove(productId: string): Promise<void>
  removeAll(): Promise<void>
}
