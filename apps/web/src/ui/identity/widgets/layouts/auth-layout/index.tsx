import type { PropsWithChildren } from 'react'

import {
  AuthVisual,
  type AuthVisualVariant,
} from '@/ui/identity/widgets/layouts/auth-visual'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AuthLayoutProps = PropsWithChildren<{
  eyebrow?: string
  visual?: AuthVisualVariant
}>

export const AuthLayout = ({ children, visual = 'login' }: AuthLayoutProps) => {
  return (
    <main className='flex min-h-screen min-w-80 flex-col bg-card lg:flex-row'>
      <section className='flex min-h-screen w-full flex-col bg-card px-5 pb-8 pt-5 sm:px-10 lg:w-[620px] lg:shrink-0 lg:px-16 lg:pt-7'>
        <header className='flex items-center justify-between gap-6'>
          <div className='flex shrink-0 items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-[10px] bg-primary'>
              <Icon
                className='size-[22px] text-primary-foreground'
                name='ice-cream-bowl'
              />
            </div>
            <span className='text-xl font-black italic tracking-[-0.5px] text-primary'>
              Scoops
            </span>
          </div>
          <div className='hidden shrink-0 items-center gap-1.5 text-[13px] font-medium text-muted-foreground sm:flex'>
            <span>Ainda não tem uma sorveteria?</span>
            <span className='font-extrabold text-primary'>Criar conta</span>
          </div>
        </header>

        <div className='flex flex-1 items-center justify-center'>
          <div className='auth-form-entrance w-full max-w-[420px]'>{children}</div>
        </div>
      </section>

      <AuthVisual variant={visual} />
    </main>
  )
}
