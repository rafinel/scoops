import type { PropsWithChildren } from 'react'

import { useLocation } from '@tanstack/react-router'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import { ROUTES, type RouteName } from '@/constants/routes'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

import { UserMenu } from './user-menu'
import { useAppLayout } from './use-app-layout'

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation()
  const { account, error, isPending, handleLogout } = useAppLayout()
  const isUsers = location.pathname.startsWith('/users')
  const primaryLinks: Array<{ icon: IconName; label: string; route: RouteName }> = [
    { icon: 'layout-dashboard', label: 'Dashboard', route: 'app' },
    { icon: 'package', label: 'Produtos', route: 'products' },
    { icon: 'shopping-cart', label: 'Nova venda', route: 'newSale' },
    { icon: 'clipboard-list', label: 'Pedidos', route: 'orders' },
    { icon: 'store', label: 'Canais de venda', route: 'salesChannels' },
    { icon: 'tags', label: 'Descontos', route: 'discounts' },
  ]
  const userMenu = account ? (
    <UserMenu
      account={account}
      error={error instanceof Error ? error : null}
      isPending={isPending}
      onLogout={handleLogout}
    />
  ) : null

  return (
    <div className='min-h-screen bg-background font-sans text-foreground'>
      <div className='flex min-h-screen w-full'>
        <aside className='hidden w-[280px] shrink-0 border-r border-border bg-card px-5 pb-6 pt-7 lg:flex lg:flex-col'>
          <div className='flex items-center gap-3'>
            <span className='grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-primary'>
              <Icon name='ice-cream-bowl' className='size-[22px]' />
            </span>
            <div>
              <p className='text-xl font-black italic tracking-tight text-primary'>
                Scoops
              </p>
              <p className='text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground'>
                Gestão de sorveterias
              </p>
            </div>
          </div>
          <nav aria-label='Navegação principal' className='mt-9 space-y-1'>
            {primaryLinks.map(({ icon, label, route }) => {
              const isActive = location.pathname === ROUTES[route]

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
          <div className='mt-auto space-y-1 border-t border-border-soft pt-5'>
            {account?.profile === UserProfile.Manager ? (
              <Anchor
                aria-current={isUsers ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${
                  isUsers
                    ? 'bg-accent text-primary'
                    : 'text-foreground hover:bg-muted hover:text-foreground'
                }`}
                route='users'
              >
                <Icon name='users' className='size-[18px]' />
                Usuários
              </Anchor>
            ) : null}
            <Anchor
              aria-current={
                location.pathname === ROUTES.subscription ? 'page' : undefined
              }
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${
                location.pathname === ROUTES.subscription
                  ? 'bg-accent text-primary'
                  : 'text-foreground hover:bg-muted hover:text-foreground'
              }`}
              route='subscription'
            >
              <Icon name='credit-card' className='size-[18px]' />
              Assinatura
            </Anchor>
          </div>
        </aside>
        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='border-b bg-card'>
            <div className='mx-auto flex min-h-[72px] w-full items-center gap-3 px-4 sm:gap-5 sm:px-8'>
              <Label className='flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20'>
                <Icon
                  name='search'
                  className='size-[18px] shrink-0 text-muted-foreground'
                />
                <Input
                  aria-label='Busca Geral'
                  className='h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0'
                  placeholder='Busca Geral'
                />
              </Label>
              <Button
                aria-label='Notificações'
                className='size-10 shrink-0 rounded-lg border-0 text-muted-foreground'
                size='icon'
                type='button'
                variant='ghost'
              >
                <Icon name='bell' className='size-[18px]' />
              </Button>
              {userMenu}
            </div>
          </header>
          <main className='mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-screen-2xl flex-1 flex-col px-4 py-6 sm:px-8 lg:px-10 lg:py-8'>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
