import type { UserAuditRecordCreate } from '#identity/domain/entities/user-audit-record-create.ts'
import type { UserAuditRecord } from '#identity/domain/entities/user-audit-record.ts'

export interface UserAuditRecordsRepository {
  add(input: UserAuditRecordCreate): Promise<UserAuditRecord>
  addMany(inputs: UserAuditRecordCreate[]): Promise<UserAuditRecord[]>
  findManyByUser(input: {
    establishmentId: string
    affectedUserId: string
  }): Promise<UserAuditRecord[]>
  removeAll(): Promise<void>
}
