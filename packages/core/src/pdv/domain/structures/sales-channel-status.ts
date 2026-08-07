export const SalesChannelStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const

export type SalesChannelStatus =
  (typeof SalesChannelStatus)[keyof typeof SalesChannelStatus]
