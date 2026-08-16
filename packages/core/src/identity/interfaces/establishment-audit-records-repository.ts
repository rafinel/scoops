import type { EstablishmentAuditRecordCreate } from '#identity/domain/entities/establishment-audit-record-create.ts'
import type { EstablishmentAuditRecord } from '#identity/domain/entities/establishment-audit-record.ts'

export interface EstablishmentAuditRecordsRepository {
  add(input: EstablishmentAuditRecordCreate): Promise<EstablishmentAuditRecord>
  addMany(inputs: EstablishmentAuditRecordCreate[]): Promise<EstablishmentAuditRecord[]>
  findManyByEstablishment(establishmentId: string): Promise<EstablishmentAuditRecord[]>
  removeAll(): Promise<void>
}
