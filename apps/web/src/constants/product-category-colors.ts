import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  ingredient: 'text-category-ingredient',
  manufacturable: 'text-category-manufacturable',
  portion: 'text-category-portion',
  accompaniment: 'text-category-accompaniment',
  resale: 'text-category-resale',
}

export const CATEGORY_SOFT_CLASSES: Record<ProductCategory, string> = {
  ingredient: 'bg-category-ingredient-bg text-category-ingredient',
  manufacturable: 'bg-category-manufacturable-bg text-category-manufacturable',
  portion: 'bg-category-portion-bg text-category-portion',
  accompaniment: 'bg-category-accompaniment-bg text-category-accompaniment',
  resale: 'bg-category-resale-bg text-category-resale',
}

export const CATEGORY_OUTLINE_CLASSES: Record<ProductCategory, string> = {
  ingredient:
    'border-category-ingredient-border bg-category-ingredient-bg text-category-ingredient',
  manufacturable:
    'border-category-manufacturable-border bg-category-manufacturable-bg text-category-manufacturable',
  portion: 'border-category-portion-border bg-category-portion-bg text-category-portion',
  accompaniment:
    'border-category-accompaniment-border bg-category-accompaniment-bg text-category-accompaniment',
  resale: 'border-category-resale-border bg-category-resale-bg text-category-resale',
}
