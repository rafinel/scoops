import {
  EstablishmentAuditAction,
  type EstablishmentAuditAction as EstablishmentAuditActionValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const establishmentAuditActionModel = pgEnum(
  'establishment_audit_action',
  Object.values(EstablishmentAuditAction) as [
    EstablishmentAuditActionValue,
    ...EstablishmentAuditActionValue[],
  ],
)
