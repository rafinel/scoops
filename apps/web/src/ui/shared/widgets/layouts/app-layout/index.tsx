import type { PropsWithChildren } from 'react'

import { NotificationShellContextProvider } from '@/ui/communication/contexts/notification-shell-context'
import { useNotificationShellProvider } from '@/ui/communication/contexts/notification-shell-context/use-notification-shell-provider'
import { useNotificationRealtime } from '@/ui/communication/hooks/use-notification-realtime'
import { MobileSidebar } from './mobile-sidebar'
import { AppLayoutHeader } from './header'
import { AppLayoutSidebar } from './sidebar'
import { UserMenu } from './user-menu'
import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { useAppLayout } from './use-app-layout'

export type AppLayoutProps = PropsWithChildren

export { isSidebarItemActive } from './sidebar/sidebar-navigation/is-sidebar-item-active'

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { pathname } = useUrlPathname()
  const {
    account,
    error,
    isPending,
    handleLogout,
    handleMobileSidebarNavigate,
    handleMobileSidebarOpenChange,
    isMobileSidebarOpen,
    primaryItems,
    secondaryItems,
  } = useAppLayout()
  const shell = useNotificationShellProvider()

  useNotificationRealtime({
    enabled: shell.isEligible && shell.isLeader,
    onNotificationCreated: shell.onNotification,
  })

  const userMenu = account ? (
    <UserMenu
      account={account}
      error={error instanceof Error ? error : null}
      isPending={isPending}
      onLogout={handleLogout}
    />
  ) : null

  return (
    <NotificationShellContextProvider value={shell}>
      <div className='min-h-screen bg-background font-sans text-foreground'>
        <div className='flex min-h-screen w-full'>
          <AppLayoutSidebar
            pathname={pathname}
            primaryItems={primaryItems}
            secondaryItems={secondaryItems}
          />
          <div className='flex min-w-0 flex-1 flex-col'>
            <AppLayoutHeader
              isMobileSidebarOpen={isMobileSidebarOpen}
              onOpenMobileSidebar={() => handleMobileSidebarOpenChange(true)}
              userMenu={userMenu}
            />
            <main className='mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-9 lg:py-7'>
              {children}
            </main>
          </div>
          <MobileSidebar
            onOpenChange={handleMobileSidebarOpenChange}
            open={isMobileSidebarOpen}
          >
            <AppLayoutSidebar
              mobile
              onNavigate={handleMobileSidebarNavigate}
              pathname={pathname}
              primaryItems={primaryItems}
              secondaryItems={secondaryItems}
            />
          </MobileSidebar>
        </div>
      </div>
    </NotificationShellContextProvider>
  )
}
