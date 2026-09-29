import type { AnalyticsInteraction } from '@scoops/validation'
import { analyticsInteractionSchema } from '@scoops/validation'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { useCallback, useContext } from 'react'

import { AuthContext } from '@/ui/shared/contexts/auth-context'

const logAnalyticsInteraction = createServerFn({ method: 'POST' })
  .validator(analyticsInteractionSchema)
  .handler(async () => {
    if (!getRequestHeader('cookie')) return { accepted: false as const }

    try {
      return { accepted: true as const }
    } catch {
      return { accepted: false as const }
    }
  })

export const useLogsAnalyticsInteractionAction = () => {
  const account = useContext(AuthContext)?.account ?? null
  return useCallback(
    (interaction: Omit<AnalyticsInteraction, 'tenantId'>) => {
      if (!account) return
      void logAnalyticsInteraction({
        data: { ...interaction, tenantId: account.establishmentId },
      }).catch(() => undefined)
    },
    [account],
  )
}
