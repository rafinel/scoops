import type { InferSelectModel } from 'drizzle-orm'

import type { userAuditRecordModel } from '@/identity/database/drizzle/models/user-audit-record-model'

export type DrizzleUserAuditRecord = InferSelectModel<typeof userAuditRecordModel>
