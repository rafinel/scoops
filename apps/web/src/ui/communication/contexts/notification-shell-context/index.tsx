import { createContext, type PropsWithChildren } from 'react'

import type { NotificationShellContextValue } from './types'

export type { NotificationShellContextValue } from './types'

export const NotificationShellContext =
  createContext<NotificationShellContextValue | null>(null)

export type NotificationShellContextProviderProps = PropsWithChildren<{
  value: NotificationShellContextValue
}>

export const NotificationShellContextProvider = ({
  children,
  value,
}: NotificationShellContextProviderProps) => (
  <NotificationShellContext.Provider value={value}>
    {children}
  </NotificationShellContext.Provider>
)
