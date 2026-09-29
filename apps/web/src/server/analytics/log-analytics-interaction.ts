import { analyticsInteractionSchema, type AnalyticsInteraction } from '@scoops/validation'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

export const logAnalyticsInteraction = createServerFn({ method: 'POST' })
  .validator(analyticsInteractionSchema)
  .handler(async ({ data }: { data: AnalyticsInteraction }) => {
    if (!getRequestHeader('cookie')) return { accepted: false as const }

    try {
      return { accepted: true as const }
    } catch {
      return { accepted: false as const }
    }
  })
