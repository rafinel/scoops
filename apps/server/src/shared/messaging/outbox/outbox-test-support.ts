import { randomUUID } from 'node:crypto'

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { DatabaseFixture } from '@/shared/database/fixtures/database-fixture'
import * as schema from '@/shared/database/drizzle/schema'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

export type OutboxTestDatabase = PostgresJsDatabase<typeof schema>

export async function openOutboxDatabase() {
  const fixture = await DatabaseFixture.register()
  const client = postgres(process.env.DATABASE_URL as string)
  const database = drizzle(client, { schema })

  return {
    database,
    async reset() {
      await fixture.reset()
    },
    async close() {
      await client.end()
      await fixture.close()
    },
  }
}

export async function insertOutboxEvent(
  database: OutboxTestDatabase,
  overrides: Partial<typeof eventModel.$inferInsert> = {},
) {
  const now = new Date('2026-09-02T12:00:00.000Z')
  const [event] = await database
    .insert(eventModel)
    .values({
      id: randomUUID(),
      eventName: 'identity/onboarding-confirmation.prepared',
      payload: {
        userId: '00000000-0000-4000-8000-000000000001',
        email: 'test@example.com',
        name: 'Test User',
        actionUrl: 'http://localhost:4000/onboarding/confirm?confirmationToken=test',
        expiresAt: '2026-09-09T12:00:00.000Z',
        occurredAt: '2026-09-02T12:00:00.000Z',
      },
      occurredAt: now,
      availableAt: now,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .returning()

  return event
}
