const SALES_CHANNELS_ROOT = ['pdv', 'sales-channels'] as const

export const salesChannelQueryKeys = {
  all: SALES_CHANNELS_ROOT,
  list: () => [...SALES_CHANNELS_ROOT, 'list'] as const,
  active: () => [...SALES_CHANNELS_ROOT, 'active'] as const,
}
