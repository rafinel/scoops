import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  ingredient: 'text-blue-700',
  manufacturable: 'text-violet-700',
  portion: 'text-green-700',
  accompaniment: 'text-amber-700',
  resale: 'text-red-700',
}
