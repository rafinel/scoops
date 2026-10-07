import type { PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ApplicationProviders } from './application-providers'
import { RootDocument } from './root-document'

const queryClient = new QueryClient()

export type RootLayoutProps = PropsWithChildren

export const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ApplicationProviders>
        <RootDocument>{children}</RootDocument>
      </ApplicationProviders>
    </QueryClientProvider>
  )
}
