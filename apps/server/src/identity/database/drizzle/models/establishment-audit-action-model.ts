import {
  EstablishmentAuditAction,
  type EstablishmentAuditAction as EstablishmentAuditActionValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

const establishmentAuditActions = Object.values(EstablishmentAuditAction) as [
  EstablishmentAuditActionValue,
  ...EstablishmentAuditActionValue[],
]

export const establishmentAuditActionModel = pgEnum(
  'establishment_audit_action',
  establishmentAuditActions,
)
