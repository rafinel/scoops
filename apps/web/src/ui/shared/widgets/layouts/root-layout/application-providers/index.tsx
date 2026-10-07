import type { PropsWithChildren } from 'react'

import { AuthContextProvider } from '@/ui/shared/contexts/auth-context'
import { AnalyticsContextProvider } from '@/ui/shared/contexts/analytics-context'
import { RestContextProvider } from '@/ui/shared/contexts/rest-context'

export type ApplicationProvidersProps = PropsWithChildren

export const ApplicationProviders = ({ children }: ApplicationProvidersProps) => {
  return (
    <AuthContextProvider>
      <AnalyticsContextProvider>
        <RestContextProvider>{children}</RestContextProvider>
      </AnalyticsContextProvider>
    </AuthContextProvider>
  )
}
