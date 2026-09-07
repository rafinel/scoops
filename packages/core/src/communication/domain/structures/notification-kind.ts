export const NotificationKind = {
  StockBelowIdeal: 'stock-below-ideal',
  StockZero: 'stock-zero',
  UserAdded: 'user-added',
  UserPromoted: 'user-promoted',
  UserDemoted: 'user-demoted',
  UserInactivated: 'user-inactivated',
  UserReactivated: 'user-reactivated',
} as const

export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind]
