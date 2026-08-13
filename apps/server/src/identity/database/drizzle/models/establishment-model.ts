import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { establishmentStatusModel } from '@/identity/database/drizzle/models/establishment-status-model'

export const establishmentModel = pgTable(
  'establishments',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    status: establishmentStatusModel('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [index('establishments_status_idx').on(table.status)],
)
