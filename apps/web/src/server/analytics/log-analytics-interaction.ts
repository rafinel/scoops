import { analyticsInteractionSchema, type AnalyticsInteraction } from '@scoops/validation'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

const LOG_EVENT = 'analytics.interaction'

export const logAnalyticsInteraction = createServerFn({ method: 'POST' })
  .validator(analyticsInteractionSchema)
  .handler(async ({ data }: { data: AnalyticsInteraction }) => {
    if (!getRequestHeader('cookie')) return { accepted: false as const }

    try {
      console.info(LOG_EVENT, {
        tenantId: data.tenantId,
        event: data.event,
        period: data.period,
        target: data.target,
        source: data.source,
        occurredAt: new Date().toISOString(),
      })
      return { accepted: true as const }
    } catch {
      return { accepted: false as const }
    }
  })
