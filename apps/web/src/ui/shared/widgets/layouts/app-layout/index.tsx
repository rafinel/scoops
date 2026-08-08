import type { PropsWithChildren } from 'react'

export type AppLayoutProps = PropsWithChildren

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className='min-h-screen bg-background font-sans text-foreground'>
      <main className='mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col px-4 py-6 sm:px-8'>
        {children}
      </main>
    </div>
  )
}
