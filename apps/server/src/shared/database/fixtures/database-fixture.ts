import { resolve } from 'node:path'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

export class DatabaseFixture {
  private container: StartedPostgreSqlContainer | undefined
  private readonly originalDatabaseUrl = process.env.DATABASE_URL

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
      const tables = await databaseClient<{ tableName: string }[]>`
        SELECT tablename AS "tableName"
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '__drizzle_migrations'
      `

      if (tables.length === 0) return

      const tableNames = tables
        .map(({ tableName }) => `"public"."${tableName.replaceAll('"', '""')}"`)
        .join(', ')

      await databaseClient.unsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
    } finally {
      await databaseClient.end()
    }
  }

  async close() {
    await this.container?.stop()
    this.container = undefined

    if (this.originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = this.originalDatabaseUrl
    }
  }

  private async start() {
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('scoops_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()

    process.env.DATABASE_URL = this.getConnectionUri()

    const migrationClient = postgres(this.getConnectionUri())

    try {
      await migrate(drizzle(migrationClient), {
        migrationsFolder: resolve(
          process.cwd(),
          'src/shared/database/drizzle/migrations',
        ),
      })
    } finally {
      await migrationClient.end()
    }
  }

  private getConnectionUri() {
    if (!this.container) {
      throw new Error('Database fixture is not running')
    }

    return this.container.getConnectionUri()
  }
}
