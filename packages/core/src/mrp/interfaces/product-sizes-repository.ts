import type {
  ProductSize,
  ProductSizeCreate,
  ProductSizeUpdate,
} from '#mrp/domain/entities/product-size.ts'

export interface ProductSizesRepository {
  add(input: ProductSizeCreate): Promise<ProductSize>
  findById(sizeId: string): Promise<ProductSize | undefined>
  findManyByProductId(productId: string): Promise<readonly ProductSize[]>
  replace(sizeId: string, changes: ProductSizeUpdate): Promise<ProductSize>
  remove(sizeId: string): Promise<void>
}
