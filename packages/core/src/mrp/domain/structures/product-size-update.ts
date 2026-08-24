import type { ProductSize } from '#mrp/domain/entities/product-size.ts'

export type ProductSizeUpdate = Partial<
  Pick<ProductSize, 'name' | 'quantity' | 'price' | 'isActive'>
>
