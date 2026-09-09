import { useContext } from 'react'

import { AppError } from '@scoops/core/shared/domain/errors'

import { AuthContext } from '@/ui/shared/contexts/auth-context'

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new AppError('useAuthContext deve ser usado dentro de AuthContextProvider.')
  }

  return context
}
