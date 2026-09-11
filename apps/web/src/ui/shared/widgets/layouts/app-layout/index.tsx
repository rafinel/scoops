import { createElement } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'

import { useLocation } from '@tanstack/react-router'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ROUTES } from '@/constants/routes'
import type { SidebarItem } from '@/constants/sidebar-items'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { NotificationShellContextProvider } from '@/ui/communication/contexts/notification-shell-context'
import { useNotificationShellProvider } from '@/ui/communication/contexts/notification-shell-context/use-notification-shell-provider'
import { useNotificationRealtime } from '@/ui/communication/hooks/use-notification-realtime'
import { NotificationDropdown } from '@/ui/communication/widgets/components/notification-dropdown'

import { UserMenu } from './user-menu'
import { useAppLayout } from './use-app-layout'

export function isSidebarItemActive(
  pathname: string,
  item: Pick<SidebarItem, 'route' | 'activePrefixes'>,
): boolean {
  const normalizedPathname = normalizePathname(pathname)
  return [ROUTES[item.route], ...(item.activePrefixes ?? [])].some((route) =>
    isPathActive(normalizedPathname, route),
  )
}

function isPathActive(pathname: string, prefix: string) {
  const normalizedPrefix = normalizePathname(prefix)
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) =>
  createElement(AppLayoutFrame, useAppLayoutFrameProps(children))

function useAppLayoutFrameProps(children: ReactNode) {
  const locationPathname = useLocation().pathname
  const layout = useAppLayout()
  const shell = useAppLayoutNotifications()
  return createAppLayoutFrameProps(children, locationPathname, layout, shell)
}

const createAppLayoutFrameProps = (
  children: ReactNode,
  locationPathname: string,
  layout: ReturnType<typeof useAppLayout>,
  shell: ReturnType<typeof useNotificationShellProvider>,
) => ({
  children,
  locationPathname,
  layout,
  shell,
  userMenu: createAppLayoutUserMenu(layout),
})

function useAppLayoutNotifications() {
  const shell = useNotificationShellProvider()
  useNotificationRealtime({
    enabled: shell.isEligible && shell.isLeader,
    onNotificationCreated: shell.onNotification,
  })
  return shell
}

function createAppLayoutUserMenu(layout: ReturnType<typeof useAppLayout>) {
  return (
    <AppLayoutUserMenu
      account={layout.account}
      error={layout.error instanceof Error ? layout.error : null}
      isPending={layout.isPending}
      onLogout={layout.handleLogout}
    />
  )
}

const AppLayoutFrame = ({
  children,
  locationPathname,
  layout,
  shell,
  userMenu,
}: {
  children: ReactNode
  locationPathname: string
  layout: ReturnType<typeof useAppLayout>
  shell: ReturnType<typeof useNotificationShellProvider>
  userMenu: ReactNode
}) =>
  createElement(
    NotificationShellContextProvider,
    { value: shell },
    createElement(
      'div',
      { className: 'min-h-screen bg-background font-sans text-foreground' },
      createElement(
        'div',
        { className: 'flex min-h-screen w-full' },
        createElement(AppLayoutSidebar, {
          pathname: locationPathname,
          primaryItems: layout.primaryItems,
          secondaryItems: layout.secondaryItems,
        }),
        createElement(AppLayoutContent, { children, userMenu }),
      ),
    ),
  )

type AppLayoutSidebarProps = {
  pathname: string
  primaryItems: readonly SidebarItem[]
  secondaryItems: readonly SidebarItem[]
}

const AppLayoutSidebarAttributes = {
  className:
    'sticky top-0 hidden h-screen max-h-screen w-[266px] shrink-0 overflow-y-auto border-r border-border bg-card px-5 pb-6 pt-7 lg:flex lg:flex-col',
} as const

const AppLayoutSidebar = (props: AppLayoutSidebarProps) =>
  createElement(
    'aside',
    AppLayoutSidebarAttributes,
    createAppLayoutSidebarChildren(props),
  )

const createAppLayoutSidebarChildren = ({
  pathname,
  primaryItems,
  secondaryItems,
}: AppLayoutSidebarProps) => [
  createElement(AppLayoutBrand, { key: 'brand' }),
  createElement(SidebarNavigation, {
    ariaLabel: 'Navegação principal',
    items: primaryItems,
    pathname,
    key: 'primary',
  }),
  createElement(SidebarNavigation, {
    className: 'mt-auto space-y-1 border-t border-border-soft pt-5',
    items: secondaryItems,
    pathname,
    key: 'secondary',
  }),
]

const AppLayoutBrand = () =>
  createElement(
    'div',
    { className: 'flex items-center gap-3' },
    createElement(
      'span',
      {
        className:
          'grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-primary',
      },
      createElement(Icon, { className: 'size-[22px]', name: 'ice-cream-bowl' }),
    ),
    createElement(
      'p',
      { className: 'text-xl font-black italic tracking-tight text-primary' },
      'Scoops',
    ),
  )

function SidebarNavigation({
  ariaLabel,
  className = 'mt-14 space-y-1',
  items,
  pathname,
}: {
  ariaLabel?: string
  className?: string
  items: readonly SidebarItem[]
  pathname: string
}) {
  return createElement(
    'nav',
    { 'aria-label': ariaLabel, className },
    items.map((item) => createSidebarLink(pathname, item)),
  )
}

const createSidebarLink = (pathname: string, item: SidebarItem) =>
  createElement(
    Anchor,
    createSidebarLinkAttributes(pathname, item),
    createElement(Icon, { className: 'size-[18px]', name: item.icon }),
    item.label,
  )

const createSidebarLinkAttributes = (pathname: string, item: SidebarItem) => {
  const { isActive, className } = getSidebarLinkState(pathname, item)
  return {
    'aria-current': isActive ? ('page' as const) : undefined,
    className,
    key: item.route,
    route: item.route,
  }
}

const getSidebarLinkState = (pathname: string, item: SidebarItem) => {
  const isActive = isSidebarItemActive(pathname, item)
  return {
    className: `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted hover:text-foreground'}`,
    isActive,
  }
}

function AppLayoutContent({
  children,
  userMenu,
}: {
  children: ReactNode
  userMenu: ReactNode
}) {
  return createElement(
    'div',
    { className: 'flex min-w-0 flex-1 flex-col' },
    createElement(AppLayoutHeader, { userMenu }),
    createElement(AppLayoutMain, { children }),
  )
}

const AppLayoutMain = ({ children }: { children: ReactNode }) =>
  createElement(
    'main',
    {
      className:
        'mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-9 lg:py-7',
    },
    children,
  )

const AppLayoutHeader = ({ userMenu }: { userMenu: ReactNode }) =>
  createElement(
    'header',
    { className: 'border-b bg-card' },
    createElement(
      'div',
      {
        className:
          'mx-auto flex min-h-[72px] w-full items-center gap-3 px-4 sm:gap-5 sm:px-6',
      },
      createElement(
        Label,
        {
          className:
            'flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20',
        },
        createElement(Icon, {
          className: 'size-[18px] shrink-0 text-muted-foreground',
          name: 'search',
        }),
        createElement(Input, {
          'aria-label': 'Buscar no Scoops',
          className:
            'h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0',
          placeholder: 'Buscar no Scoops...',
        }),
      ),
      createElement(NotificationDropdown),
      userMenu,
    ),
  )

function AppLayoutUserMenu({
  account,
  error,
  isPending,
  onLogout,
}: {
  account: ReturnType<typeof useAppLayout>['account']
  error: Error | null
  isPending: boolean
  onLogout: () => Promise<void>
}) {
  if (!account) return null
  return (
    <UserMenu account={account} error={error} isPending={isPending} onLogout={onLogout} />
  )
}
