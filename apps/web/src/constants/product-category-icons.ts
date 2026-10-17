import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import type { IconName } from '@/ui/shared/widgets/components/icon/types'

export const CATEGORY_ICONS: Record<ProductCategory, IconName> = {
  ingredient: 'package-open',
  manufacturable: 'chef-hat',
  portion: 'ice-cream-bowl',
  accompaniment: 'candy',
  resale: 'shopping-bag',
}
