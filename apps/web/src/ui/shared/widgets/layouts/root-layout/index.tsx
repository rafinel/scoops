import { useEffect, useState, type PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClientOnly, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { AuthContextProvider } from '@/ui/shared/contexts/auth-context'
import { RestContextProvider } from '@/ui/shared/contexts/rest-context'

const queryClient = new QueryClient()

export type RootLayoutProps = PropsWithChildren

export const RootLayout = ({ children }: RootLayoutProps) => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
              {isHydrated ? (
                <TanStackDevtools
                  config={{ position: 'bottom-right' }}
                  plugins={[
                    {
                      name: 'TanStack Router',
                      render: <TanStackRouterDevtoolsPanel />,
                    },
                  ]}
                />
              ) : null}
              <Scripts />
            </body>
          </html>
        </RestContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}
