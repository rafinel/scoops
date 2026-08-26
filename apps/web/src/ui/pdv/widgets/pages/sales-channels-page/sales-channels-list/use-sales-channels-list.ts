import { useMemo } from 'react'

import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

export type UseSalesChannelsListResult = {
  filteredChannels: readonly SalesChannel[]
}

export function useSalesChannelsList(
  channels: readonly SalesChannel[],
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined,
): UseSalesChannelsListResult {
  const filteredChannels = useMemo(() => {
    if (!adjustmentFilter) return channels

    return channels.filter((channel) => {
      if (adjustmentFilter === 'increase') return channel.percentage > 0
      if (adjustmentFilter === 'discount') return channel.percentage < 0
      return channel.percentage === 0
    })
  }, [adjustmentFilter, channels])

  return {
    filteredChannels,
  }
}
