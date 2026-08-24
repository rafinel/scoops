import type { RegisterProductSizeInput } from '#mrp/domain/structures/register-product-size-input.ts'

export type UpdateProductSizeInput = RegisterProductSizeInput & {
  isActive: boolean
}
