import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductCategoryDependency } from '#mrp/domain/structures/product-category-dependency.ts'

export type ProductCategoryRemovalImpact = {
  category: ProductCategory
  canRemove: boolean
  dependencies: readonly ProductCategoryDependency[]
}
