import { useContext } from 'react'

import { AppError } from '@scoops/core/shared/domain/errors'

import { RestContext } from '@/ui/shared/contexts/rest-context'

export function useRestContext() {
  const context = useContext(RestContext)

  if (!context) {
    throw new AppError('useRestContext deve ser usado dentro de RestContextProvider.')
  }

  return context
}
