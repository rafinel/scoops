import { useContext } from 'react'

import { AppError } from '@scoops/core/shared/domain/errors'

import { AnalyticsContext } from '@/ui/shared/contexts/analytics-context'

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)

  if (!context) {
    throw new AppError(
      'useAnalyticsContext deve ser usado dentro de AnalyticsContextProvider.',
    )
  }

  return context
}
