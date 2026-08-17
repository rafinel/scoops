import type { InferSelectModel } from 'drizzle-orm'

import type { establishmentAuditRecordModel } from '@/identity/database/drizzle/models/establishment-audit-record-model'

export type DrizzleEstablishmentAuditRecord = InferSelectModel<
  typeof establishmentAuditRecordModel
>
