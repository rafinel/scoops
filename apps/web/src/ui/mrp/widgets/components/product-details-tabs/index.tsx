import type { Product } from '@scoops/core/mrp/domain/entities'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type ProductDetailsTab =
  | 'stock'
  | 'recipe'
  | 'accompaniments'
  | 'prices'
  | 'settings'
export type ProductDetailsTabsProps = {
  product: Product
  selectedTab: ProductDetailsTab
}

const TAB_CONFIG: Array<{
  icon: IconName
  label: string
  route:
    | 'productDetailsStock'
    | 'productDetailsRecipe'
    | 'productDetailsAccompaniments'
    | 'productDetailsPrices'
    | 'productDetailsSettings'
  value: ProductDetailsTab
}> = [
  { icon: 'package', label: 'Estoque', route: 'productDetailsStock', value: 'stock' },
  { icon: 'chef-hat', label: 'Receita', route: 'productDetailsRecipe', value: 'recipe' },
  {
    icon: 'layers',
    label: 'Acompanhamentos',
    route: 'productDetailsAccompaniments',
    value: 'accompaniments',
  },
  { icon: 'tag', label: 'Preços', route: 'productDetailsPrices', value: 'prices' },
  {
    icon: 'settings',
    label: 'Configurações',
    route: 'productDetailsSettings',
    value: 'settings',
  },
]

export const ProductDetailsTabs = ({ product, selectedTab }: ProductDetailsTabsProps) => {
  const hasCategory = (category: Product['categories'][number]) =>
    product.categories.includes(category)
  const visibleTabs = TAB_CONFIG.filter(({ value }) => {
    if (value === 'recipe') return hasCategory('manufacturable')
    if (value === 'accompaniments') return hasCategory('portion')
    if (value === 'prices') return hasCategory('portion') || hasCategory('resale')
    return true
  })

  return (
    <div
      aria-label='Detalhes do produto'
      className='inline-flex max-w-full min-w-0 gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1'
      role='tablist'
    >
      {visibleTabs.map(({ icon, label, route, value }) => (
        <Anchor
          aria-selected={selectedTab === value}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm leading-tight transition-colors ${selectedTab === value ? 'bg-card font-bold text-primary shadow-sm' : 'font-semibold text-muted-foreground hover:text-foreground'}`}
          key={value}
          params={{ productId: product.id }}
          role='tab'
          route={route}
        >
          <Icon className='size-3.5' name={icon} /> {label}
        </Anchor>
      ))}
    </div>
  )
}
