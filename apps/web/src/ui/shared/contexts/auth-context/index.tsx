import { createContext, useEffect, useState, type PropsWithChildren } from 'react'

import {
  AUTH_IDENTITY_SERVICE,
  AUTH_PROVIDER,
  hasAuthPasswordRecoveryRedirect,
} from '@/provision/auth/auth-composition'
import { clearPasswordRecoveryRedirect } from '@/provision/auth/supabase/supabase-client'

import type { AuthContextValue } from './types'
import { useAuthContextProvider } from './use-auth-context-provider'

export type AuthContextProviderProps = PropsWithChildren

export const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [initialRecovery] = useState(hasAuthPasswordRecoveryRedirect)
  const value = useAuthContextProvider(
    AUTH_PROVIDER,
    AUTH_IDENTITY_SERVICE,
    initialRecovery,
  )

  useEffect(() => {
    if (value.status !== 'resolving') clearPasswordRecoveryRedirect()
  }, [value.status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
