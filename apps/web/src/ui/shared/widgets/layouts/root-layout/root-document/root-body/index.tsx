import type { PropsWithChildren } from 'react'

import { ClientOnly, Scripts } from '@tanstack/react-router'
import { Toaster } from 'sonner'

import { RouteTransitionStatus } from '@/ui/shared/widgets/components/route-transition-status'

const TOASTER_PROPS = {
  containerAriaLabel: 'Notificações do Scoops',
  expand: true,
  position: 'top-right',
  richColors: true,
  visibleToasts: 3,
} as const

export type RootBodyProps = PropsWithChildren

export const RootBody = ({ children }: RootBodyProps) => {
  return (
    <body className='antialiased [overflow-wrap:anywhere]'>
      <ClientOnly fallback={null}>
        {children}
        <RouteTransitionStatus />
      </ClientOnly>
      <Toaster {...TOASTER_PROPS} />
      <Scripts />
    </body>
  )
}
