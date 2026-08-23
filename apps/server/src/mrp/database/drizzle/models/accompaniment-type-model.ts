import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const accompanimentTypeModel = pgTable(
  'mrp_accompaniment_types',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('mrp_accompaniment_types_establishment_name_unique').on(
      table.establishmentId,
      sql`lower(${table.name})`,
    ),
    index('mrp_accompaniment_types_establishment_name_id_idx').on(
      table.establishmentId,
      sql`lower(${table.name})`,
      table.id,
    ),
    check(
      'mrp_accompaniment_types_name_not_blank',
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
  ],
)
