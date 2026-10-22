import type {
  ProductCategory,
  ProductCategoryDependency,
} from '@scoops/core/mrp/domain/structures'

import { productPortionsRoute, ROUTES } from '@/constants/routes'

export type DependencyPathContext = {
  category: ProductCategory
  productId: string
  savedCategories: readonly ProductCategory[]
}

function routeOf(pattern: string, productId: string) {
  return pattern.replace('$productId', productId)
}

// The Porções tab exists only for an Accompaniment without the Portion category (saved
// state); a legacy product that also is a Portion keeps the filtered Products listing.
function hasPortionsTab(savedCategories: readonly ProductCategory[]) {
  return savedCategories.includes('accompaniment') && !savedCategories.includes('portion')
}

const DEPENDENCY_TARGETS: Record<
  Exclude<ProductCategoryDependency['kind'], 'accompaniment-user'>,
  { focus?: string; route: string }
> = {
  'consuming-recipe': { route: ROUTES.productDetailsRecipe },
  'owned-recipe': { route: ROUTES.productDetailsRecipe },
  'portion-size': { focus: 'sizes', route: ROUTES.productDetailsPrices },
  'resale-configuration': { focus: 'resale', route: ROUTES.productDetailsPrices },
  'portion-accompaniment': { route: ROUTES.productDetailsAccompaniments },
}

export function getDependencyPath(
  dependency: ProductCategoryDependency,
  { category, productId, savedCategories }: DependencyPathContext,
) {
  const retry = new URLSearchParams({
    retryCategory: category,
    retryDependency: dependency.kind,
    retryProductId: productId,
  })
  if (dependency.kind === 'accompaniment-user') {
    if (hasPortionsTab(savedCategories)) {
      return `${productPortionsRoute(productId)}?${retry.toString()}`
    }
    retry.set('usedAsAccompanimentId', productId)
    return `${ROUTES.products}?${retry.toString()}`
  }
  const { focus, route } = DEPENDENCY_TARGETS[dependency.kind]
  if (focus) retry.set('focus', focus)
  return `${routeOf(route, dependency.productId)}?${retry.toString()}`
}
