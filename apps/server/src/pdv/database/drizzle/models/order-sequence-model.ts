import { sql } from 'drizzle-orm'
import { check, integer, pgTable, uuid } from 'drizzle-orm/pg-core'

export const orderSequenceModel = pgTable(
  'pdv_order_sequences',
  {
    establishmentId: uuid('establishment_id').primaryKey(),
    lastSequenceNumber: integer('last_sequence_number').notNull().default(0),
  },
  (table) => [
    check(
      'pdv_order_sequences_last_sequence_non_negative',
      sql`${table.lastSequenceNumber} >= 0`,
    ),
  ],
)
