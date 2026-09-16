import type { AnalyticsInteraction } from '@scoops/validation'
import { useCallback, useContext } from 'react'
import { logAnalyticsInteraction } from '@/server/analytics/log-analytics-interaction'
import { AuthContext } from '@/ui/shared/contexts/auth-context'

export function useAnalyticsInteraction() {
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
