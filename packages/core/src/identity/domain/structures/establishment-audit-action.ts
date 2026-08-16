export const EstablishmentAuditAction = {
  EstablishmentNameChanged: 'establishment-name-changed',
} as const

export type EstablishmentAuditAction =
  (typeof EstablishmentAuditAction)[keyof typeof EstablishmentAuditAction]
