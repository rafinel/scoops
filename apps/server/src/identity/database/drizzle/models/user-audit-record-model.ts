import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import { userAuditActionModel } from '@/identity/database/drizzle/models/user-audit-action-model'
import { userAuditActorTypeModel } from '@/identity/database/drizzle/models/user-audit-actor-type-model'

export const userAuditRecordModel = pgTable(
  'user_audit_records',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishmentModel.id, { onDelete: 'cascade' }),
    affectedUserId: uuid('affected_user_id').notNull(),
    affectedUserName: text('affected_user_name').notNull(),
    actorType: userAuditActorTypeModel('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    actorName: text('actor_name').notNull(),
    action: userAuditActionModel('action').notNull(),
    previousValue: text('previous_value'),
    newValue: text('new_value'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('user_audit_records_user_occurred_idx').on(
      table.establishmentId,
      table.affectedUserId,
      table.occurredAt,
    ),
    index('user_audit_records_action_occurred_idx').on(table.action, table.occurredAt),
  ],
)
