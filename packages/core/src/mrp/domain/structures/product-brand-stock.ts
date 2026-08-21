import type { Brand } from '#mrp/domain/entities/brand.ts'

export type ProductBrandStock = {
  readonly brand: Brand
  readonly stockQuantity: number
  readonly unitPrice: number
}
