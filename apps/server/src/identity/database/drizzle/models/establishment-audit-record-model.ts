import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import { establishmentAuditActionModel } from '@/identity/database/drizzle/models/establishment-audit-action-model'
import { userAuditActorTypeModel } from '@/identity/database/drizzle/models/user-audit-actor-type-model'

export const establishmentAuditRecordModel = pgTable(
  'establishment_audit_records',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id')
      .notNull()
      .references(() => establishmentModel.id, { onDelete: 'cascade' }),
    affectedEstablishmentName: text('affected_establishment_name').notNull(),
    actorType: userAuditActorTypeModel('actor_type').notNull(),
    actorUserId: uuid('actor_user_id'),
    actorName: text('actor_name').notNull(),
    action: establishmentAuditActionModel('action').notNull(),
    previousValue: text('previous_value'),
    newValue: text('new_value'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('establishment_audit_records_establishment_occurred_idx').on(
      table.establishmentId,
      table.occurredAt,
    ),
    index('establishment_audit_records_action_occurred_idx').on(
      table.action,
      table.occurredAt,
    ),
  ],
)
