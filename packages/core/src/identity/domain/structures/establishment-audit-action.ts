export const EstablishmentAuditAction = {
  EstablishmentNameChanged: 'establishment-name-changed',
  EstablishmentTimezoneChanged: 'establishment-timezone-changed',
} as const

export type EstablishmentAuditAction =
  (typeof EstablishmentAuditAction)[keyof typeof EstablishmentAuditAction]
