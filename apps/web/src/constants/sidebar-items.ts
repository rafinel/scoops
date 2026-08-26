import { UserProfile } from '@scoops/core/identity/domain/structures'

import type { IconName } from '@/ui/shared/widgets/components/icon'

import type { RouteName } from './routes'

export type SidebarItem = {
  icon: IconName
  label: string
  route: RouteName
  profiles?: readonly UserProfile[]
  activePrefixes?: readonly string[]
}

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { icon: 'layout-dashboard', label: 'Dashboard', route: 'app' },
  {
    icon: 'package',
    label: 'Produtos',
    route: 'products',
    activePrefixes: ['/products/'],
  },
  { icon: 'shopping-cart', label: 'Nova venda', route: 'newSale' },
  { icon: 'clipboard-list', label: 'Pedidos', route: 'orders' },
  {
    icon: 'store',
    label: 'Canais de venda',
    route: 'salesChannels',
    profiles: [UserProfile.Manager],
  },
  { icon: 'tags', label: 'Descontos', route: 'discounts' },
]

export const SIDEBAR_SECONDARY_ITEMS: readonly SidebarItem[] = [
  {
    icon: 'users',
    label: 'Usuários',
    route: 'users',
    profiles: [UserProfile.Manager],
    activePrefixes: ['/users/'],
  },
  {
    icon: 'store',
    label: 'Sorveteria',
    route: 'shopSettings',
    profiles: [UserProfile.Manager],
  },
  { icon: 'credit-card', label: 'Assinatura', route: 'subscription' },
]

export function getSidebarItems(
  profile: UserProfile | null,
  items: readonly SidebarItem[] = SIDEBAR_ITEMS,
): readonly SidebarItem[] {
  return items.filter(
    (item) => !item.profiles || (profile && item.profiles.includes(profile)),
  )
}
