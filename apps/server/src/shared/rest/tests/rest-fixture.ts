import type { INestApplication, Type } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Test, type TestingModule, type TestingModuleBuilder } from '@nestjs/testing'

import { DatabaseFixture } from '@/shared/database/fixtures/database-fixture'
import { GlobalErrorHandler } from '@/shared/rest/filters'

type TestingModuleMetadata = Parameters<typeof Test.createTestingModule>[0]

export class RestFixture {
  private constructor(
    readonly app: INestApplication,
    private readonly moduleRef: TestingModule,
    private readonly databaseFixture: DatabaseFixture,
  ) {}

  static async register(
    metadata: TestingModuleMetadata,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const databaseFixture = await DatabaseFixture.register()
    let app: INestApplication | undefined

    try {
      const builder = Test.createTestingModule(metadata)
      const moduleRef = await (configure?.(builder) ?? builder).compile()
      app = moduleRef.createNestApplication()
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest global filter registration is not a React hook.
      app.useGlobalFilters(new GlobalErrorHandler(app.get(HttpAdapterHost)))
      await app.init()

      return new RestFixture(app, moduleRef, databaseFixture)
    } catch (error) {
      try {
        await app?.close()
      } finally {
        await databaseFixture.close()
      }

      throw error
    }
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.moduleRef.get<T>(typeOrToken)
  }

  resetDatabase() {
    return this.databaseFixture.reset()
  }

  async close() {
    try {
      await this.app.close()
    } finally {
      await this.databaseFixture.close()
    }
  }
}
