import { UserProfile } from '@scoops/core/identity/domain/structures'

import type { IconName } from '@/ui/shared/widgets/components/icon'

import type { RouteName } from './routes'

export type SidebarItem = {
  icon: IconName
  label: string
  route: RouteName
  profiles?: readonly UserProfile[]
  activePrefixes?: readonly string[]
  group?: string
}

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  {
    icon: 'layout-dashboard',
    label: 'Dashboard',
    group: 'overview',
    route: 'app',
    profiles: [UserProfile.Manager],
  },
  {
    icon: 'package',
    label: 'Produtos',
    group: 'overview',
    route: 'products',
    profiles: [UserProfile.Manager, UserProfile.Operator],
    activePrefixes: ['/products/'],
  },
  { icon: 'shopping-cart', label: 'Nova venda', group: 'sales', route: 'newSale' },
  { icon: 'clipboard-list', label: 'Pedidos', group: 'sales', route: 'orders' },
  {
    icon: 'store',
    label: 'Canais de venda',
    group: 'management',
    route: 'salesChannels',
    profiles: [UserProfile.Manager, UserProfile.Operator],
  },
  {
    icon: 'tags',
    label: 'Descontos',
    group: 'management',
    route: 'discounts',
    profiles: [UserProfile.Manager, UserProfile.Operator],
    activePrefixes: ['/discounts/'],
  },
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
  {
    icon: 'credit-card',
    label: 'Assinatura',
    route: 'subscription',
    profiles: [UserProfile.Manager],
  },
]

export function getSidebarItems(
  profile: UserProfile | null,
  items: readonly SidebarItem[] = SIDEBAR_ITEMS,
): readonly SidebarItem[] {
  return items.filter(
    (item) => !item.profiles || (profile && item.profiles.includes(profile)),
  )
}
