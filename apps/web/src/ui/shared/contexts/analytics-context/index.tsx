import { createContext, type PropsWithChildren } from 'react'

import type { AnalyticsContextValue } from './types/analytics-context-value'
import { useAnalyticsContextProvider } from './use-analytics-context-provider'

export type AnalyticsContextProviderProps = PropsWithChildren

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

export const AnalyticsContextProvider = ({ children }: AnalyticsContextProviderProps) => {
  const value = useAnalyticsContextProvider()

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}
