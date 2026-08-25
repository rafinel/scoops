import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'

export type ChangeProductCategoriesInput = {
  categories: readonly ProductCategory[]
  expectedUpdatedAt: Date
}
