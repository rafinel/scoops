import type { ProductSize } from '#mrp/domain/entities/product-size.ts'

export type ProductSizeCreate = Omit<ProductSize, 'id' | 'createdAt' | 'updatedAt'>
