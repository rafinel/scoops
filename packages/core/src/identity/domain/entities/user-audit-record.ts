import type { Entity } from '#shared/domain/entities/entity.ts'
import type { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import type { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'

export type UserAuditRecord = Entity & {
  establishmentId: string
  affectedUserId: string
  affectedUserName: string
  actorType: UserAuditActorType
  actorUserId?: string
  actorName: string
  action: UserAuditAction
  previousValue?: string
  newValue?: string
  occurredAt: Date
}
