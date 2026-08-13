import { Inject, Optional } from '@nestjs/common'
import { PgDatabase } from 'drizzle-orm/pg-core'
import { type PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import * as schema from '@/shared/database/drizzle/schema'

export type DrizzleExecutor = PgDatabase<PostgresJsQueryResultHKT, typeof schema>

export abstract class DrizzleRepository {
  constructor(
    @Inject(DrizzleClient) protected readonly drizzleClient: DrizzleClient,
    @Optional() protected readonly transactionDatabase?: DrizzleExecutor,
  ) {}

  protected get database(): DrizzleExecutor {
    return this.transactionDatabase ?? this.drizzleClient.requireDatabase()
  }
}
