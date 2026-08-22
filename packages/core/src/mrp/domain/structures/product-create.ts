import type { Product } from '#mrp/domain/entities/product.ts'

export type ProductCreate = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
