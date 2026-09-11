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
  const normalizedRoute = normalizePathname(ROUTES[item.route])
  return (
    normalizedPathname === normalizedRoute ||
    Boolean(
      item.activePrefixes?.some((prefix) => {
        const normalizedPrefix = normalizePathname(prefix)
        return (
          normalizedPathname === normalizedPrefix ||
          normalizedPathname.startsWith(`${normalizedPrefix}/`)
        )
      }),
    )
  )
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation()
  const { account, error, isPending, handleLogout, primaryItems, secondaryItems } =
    useAppLayout()
  const shell = useNotificationShellProvider()
  useNotificationRealtime({
    enabled: shell.isEligible && shell.isLeader,
    onNotificationCreated: shell.onNotification,
  })
  const userMenu = (
    <AppLayoutUserMenu
      account={account}
      error={error instanceof Error ? error : null}
      isPending={isPending}
      onLogout={handleLogout}
    />
  )

  return (
    <NotificationShellContextProvider value={shell}>
      <div className='min-h-screen bg-background font-sans text-foreground'>
        <div className='flex min-h-screen w-full'>
          <AppLayoutSidebar
            pathname={location.pathname}
            primaryItems={primaryItems}
            secondaryItems={secondaryItems}
          />
          <AppLayoutContent userMenu={userMenu}>{children}</AppLayoutContent>
        </div>
      </div>
    </NotificationShellContextProvider>
  )
}

function AppLayoutSidebar({
  pathname,
  primaryItems,
  secondaryItems,
}: {
  pathname: string
  primaryItems: readonly SidebarItem[]
  secondaryItems: readonly SidebarItem[]
}) {
  return (
    <aside className='sticky top-0 hidden h-screen max-h-screen w-[266px] shrink-0 overflow-y-auto border-r border-border bg-card px-5 pb-6 pt-7 lg:flex lg:flex-col'>
      <div className='flex items-center gap-3'>
        <span className='grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-primary'>
          <Icon name='ice-cream-bowl' className='size-[22px]' />
        </span>
        <p className='text-xl font-black italic tracking-tight text-primary'>Scoops</p>
      </div>
      <SidebarNavigation
        ariaLabel='Navegação principal'
        items={primaryItems}
        pathname={pathname}
      />
      <SidebarNavigation
        className='mt-auto space-y-1 border-t border-border-soft pt-5'
        items={secondaryItems}
        pathname={pathname}
      />
    </aside>
  )
}

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
  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map(({ icon, label, route, activePrefixes }) => {
        const isActive = isSidebarItemActive(pathname, { route, activePrefixes })
        return (
          <Anchor
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${
              isActive
                ? 'bg-accent text-primary'
                : 'text-foreground hover:bg-muted hover:text-foreground'
            }`}
            key={route}
            route={route}
          >
            <Icon name={icon} className='size-[18px]' />
            {label}
          </Anchor>
        )
      })}
    </nav>
  )
}

function AppLayoutContent({
  children,
  userMenu,
}: {
  children: ReactNode
  userMenu: ReactNode
}) {
  return (
    <div className='flex min-w-0 flex-1 flex-col'>
      <header className='border-b bg-card'>
        <div className='mx-auto flex min-h-[72px] w-full items-center gap-3 px-4 sm:gap-5 sm:px-6'>
          <Label className='flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20'>
            <Icon name='search' className='size-[18px] shrink-0 text-muted-foreground' />
            <Input
              aria-label='Buscar no Scoops'
              className='h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0'
              placeholder='Buscar no Scoops...'
            />
          </Label>
          <NotificationDropdown />
          {userMenu}
        </div>
      </header>
      <main className='mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-9 lg:py-7'>
        {children}
      </main>
    </div>
  )
}

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
