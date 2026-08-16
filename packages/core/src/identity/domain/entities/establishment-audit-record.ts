import type { Entity } from '#shared/domain/entities/entity.ts'
import type { EstablishmentAuditAction } from '#identity/domain/structures/establishment-audit-action.ts'
import type { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'

export type EstablishmentAuditRecord = Entity & {
  establishmentId: string
  affectedEstablishmentName: string
  actorType: UserAuditActorType
  actorUserId?: string
  actorName: string
  action: EstablishmentAuditAction
  previousValue?: string
  newValue?: string
  occurredAt: Date
}
