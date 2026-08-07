export const EstablishmentStatus = {
  Pending: 'pending',
  Active: 'active',
  Deleted: 'deleted',
} as const

export type EstablishmentStatus =
  (typeof EstablishmentStatus)[keyof typeof EstablishmentStatus]
