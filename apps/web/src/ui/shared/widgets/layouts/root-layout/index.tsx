import type { PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClientOnly, HeadContent, Scripts } from '@tanstack/react-router'

import { AuthContextProvider } from '@/ui/shared/contexts/auth-context'
import { RestContextProvider } from '@/ui/shared/contexts/rest-context'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

export type RootLayoutProps = PropsWithChildren

export const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <RestContextProvider>
          <html lang='pt-BR'>
            <head>
              <HeadContent />
            </head>
            <body className='antialiased [overflow-wrap:anywhere]'>
              <ClientOnly fallback={null}>{children}</ClientOnly>
              <Toaster position='top-right' richColors />
              <Scripts />
            </body>
          </html>
        </RestContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}
