import type { PropsWithChildren } from 'react'

import { UserMenu } from './user-menu'
import { useAppLayout } from './use-app-layout'

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  const controller = useAppLayout()

  return (
    <div className='min-h-screen bg-background font-sans text-foreground'>
      <header className='border-b bg-card'>
        <div className='mx-auto flex min-h-16 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-8'>
          <p className='text-sm font-extrabold uppercase tracking-[0.18em] text-primary'>
            Scoops
          </p>
          {controller.account ? (
            <UserMenu
              account={controller.account}
              error={controller.error instanceof Error ? controller.error : null}
              isPending={controller.isPending}
              onLogout={controller.handleLogout}
            />
          ) : null}
        </div>
      </header>
      <main className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-screen-2xl flex-col px-4 py-6 sm:px-8'>
        {children}
      </main>
    </div>
  )
}
