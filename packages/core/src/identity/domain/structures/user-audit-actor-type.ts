export const UserAuditActorType = { User: 'user', System: 'system' } as const

export type UserAuditActorType =
  (typeof UserAuditActorType)[keyof typeof UserAuditActorType]
