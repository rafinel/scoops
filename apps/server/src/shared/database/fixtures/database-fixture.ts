import { resolve } from 'node:path'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

export class DatabaseFixture {
  private static sharedContainer: Promise<StartedPostgreSqlContainer> | undefined
  private static sharedLeaseCount = 0
  private static originalDatabaseUrl: string | undefined

  private container: StartedPostgreSqlContainer | undefined

  static async register() {
    const fixture = new DatabaseFixture()

    try {
      await fixture.start()
      return fixture
    } catch (error) {
      await fixture.close()
      throw error
    }
  }

  async reset() {
    const databaseClient = postgres(this.getConnectionUri())

    try {
      const tables = await databaseClient<{ schemaName: string; tableName: string }[]>`
        SELECT schemaname AS "schemaName", tablename AS "tableName"
        FROM pg_tables
        WHERE schemaname IN ('public', 'better_auth')
          AND NOT (schemaname = 'public' AND tablename = '__drizzle_migrations')
      `

      if (tables.length === 0) return

      const tableNames = tables
        .map(
          ({ schemaName, tableName }) =>
            `"${schemaName.replaceAll('"', '""')}"."${tableName.replaceAll('"', '""')}"`,
        )
        .join(', ')

      await databaseClient.unsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
    } finally {
      await databaseClient.end()
    }
  }

  async close() {
    if (!this.container) return

    this.container = undefined
    DatabaseFixture.sharedLeaseCount -= 1

    if (DatabaseFixture.sharedLeaseCount === 0) {
      if (DatabaseFixture.originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL
      } else {
        process.env.DATABASE_URL = DatabaseFixture.originalDatabaseUrl
      }
    }
  }

  private async start() {
    if (!DatabaseFixture.sharedContainer) {
      DatabaseFixture.originalDatabaseUrl = process.env.DATABASE_URL
      DatabaseFixture.sharedContainer = DatabaseFixture.createSharedContainer()
    }

    try {
      this.container = await DatabaseFixture.sharedContainer
    } catch (error) {
      DatabaseFixture.sharedContainer = undefined
      throw error
    }

    DatabaseFixture.sharedLeaseCount += 1

    process.env.DATABASE_URL = this.getConnectionUri()
  }

  private static async createSharedContainer() {
    const container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('scoops_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()

    const migrationClient = postgres(container.getConnectionUri())

    try {
      await migrate(drizzle(migrationClient), {
        migrationsFolder: resolve(
          process.cwd(),
          'src/shared/database/drizzle/migrations',
        ),
      })
    } catch (error) {
      await container.stop()
      throw error
    } finally {
      await migrationClient.end()
    }

    return container
  }

  private getConnectionUri() {
    if (!this.container) {
      throw new Error('Database fixture is not running')
    }

    return this.container.getConnectionUri()
  }
}
