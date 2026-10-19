import { UserProfile } from '@scoops/core/identity/domain/structures'

import type { IconName } from '@/ui/shared/widgets/components/icon'

import type { RouteName } from './routes'

export type SidebarGroup = 'general' | 'operation' | 'commercial'

export const SIDEBAR_GROUP_LABELS: Record<SidebarGroup, string> = {
  general: 'Geral',
  operation: 'Operação',
  commercial: 'Comercial',
}

export type SidebarItem = {
  icon: IconName
  label: string
  route: RouteName
  profiles?: readonly UserProfile[]
  activePrefixes?: readonly string[]
  group?: SidebarGroup
}

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  {
    icon: 'layout-dashboard',
    label: 'Dashboard',
    group: 'general',
    route: 'app',
    profiles: [UserProfile.Manager],
  },
  { icon: 'shopping-cart', label: 'Nova venda', group: 'operation', route: 'newSale' },
  { icon: 'clipboard-list', label: 'Pedidos', group: 'operation', route: 'orders' },
  {
    icon: 'package',
    label: 'Produtos',
    group: 'commercial',
    route: 'products',
    profiles: [UserProfile.Manager, UserProfile.Operator],
    activePrefixes: ['/products/'],
  },
  {
    icon: 'store',
    label: 'Canais de venda',
    group: 'commercial',
    route: 'salesChannels',
    profiles: [UserProfile.Manager, UserProfile.Operator],
  },
  {
    icon: 'tags',
    label: 'Descontos',
    group: 'commercial',
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
