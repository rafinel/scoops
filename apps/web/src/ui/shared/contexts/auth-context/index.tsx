import { createContext, useEffect, type PropsWithChildren } from 'react'

import {
  AUTH_IDENTITY_SERVICE,
  AUTH_PROVIDER,
  resolveInitialAuthRedirect,
} from '@/provision/auth/auth-composition'
import { clearPasswordRecoveryRedirect } from '@/provision/auth/supabase/supabase-client'

import type { AuthContextValue } from './types'
import { useAuthContextProvider } from './use-auth-context-provider'

export type AuthContextProviderProps = PropsWithChildren

export const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const value = useAuthContextProvider(
    AUTH_PROVIDER,
    AUTH_IDENTITY_SERVICE,
    resolveInitialAuthRedirect,
  )

  useEffect(() => {
    if (value.status !== 'resolving') clearPasswordRecoveryRedirect()
  }, [value.status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
