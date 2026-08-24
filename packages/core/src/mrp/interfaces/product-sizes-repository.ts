import type { ProductSize } from '#mrp/domain/entities/product-size.ts'
import type { ProductSizeCreate } from '#mrp/domain/structures/product-size-create.ts'
import type { ProductSizeUpdate } from '#mrp/domain/structures/product-size-update.ts'

export interface ProductSizesRepository {
  add(input: ProductSizeCreate): Promise<ProductSize>
  findById(
    establishmentId: string,
    productId: string,
    sizeId: string,
  ): Promise<ProductSize | undefined>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ProductSize[]>
  countActive(establishmentId: string, productId: string): Promise<number>
  replace(
    establishmentId: string,
    productId: string,
    sizeId: string,
    changes: ProductSizeUpdate,
  ): Promise<ProductSize>
  remove(establishmentId: string, productId: string, sizeId: string): Promise<void>
  removeAll(): Promise<void>
}
