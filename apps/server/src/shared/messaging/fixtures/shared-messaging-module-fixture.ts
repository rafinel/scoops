import type { Type } from '@nestjs/common'
import type { EventPayload, InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import {
  InngestFixture,
  type InngestTestDatabase,
} from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { ReprocessEventsJob } from '@/shared/messaging/inngest/jobs/reprocess-events-job'
import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type InngestJobType<T extends InngestJob> = Type<T> & { readonly ID: string }

export class SharedMessagingModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly inngestFixture: InngestFixture,
    private readonly originalServerAppMode: string | undefined,
    private readonly originalEmailProvider: string | undefined,
  ) {}

  static async register<Job extends InngestJob>(options: {
    readonly inngestJob: InngestJobType<Job>
  }): Promise<SharedMessagingModuleFixture> {
    const originalServerAppMode = process.env.SCOOPS_SERVER_APP_MODE
    const originalEmailProvider = process.env.SCOOPS_EMAIL_PROVIDER
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'

    let restFixture: RestFixture | undefined
    const isRecoveryJob = options.inngestJob.ID === ReprocessEventsJob.ID
    const inngestFixture = new InngestFixture({
      functionId: options.inngestJob.ID,
      createJob: async (client) => {
        const imports = isRecoveryJob
          ? [(await import('../../../app.module.js')).AppModule]
          : [SharedMessagingModule]
        restFixture = await RestFixture.register({ imports }, (builder) =>
          builder.overrideProvider(InngestClient).useValue(client),
        )
        return restFixture.get(options.inngestJob)
      },
    })

    try {
      await inngestFixture.setup()
    } catch (error) {
      const cleanupErrors: unknown[] = [error]
      try {
        await restFixture?.close()
      } catch (closeError) {
        cleanupErrors.push(closeError)
      } finally {
        SharedMessagingModuleFixture.restoreEnvironment(
          originalServerAppMode,
          originalEmailProvider,
        )
      }
      if (cleanupErrors.length > 1)
        throw new AggregateError(
          cleanupErrors,
          'Failed to register the shared job fixture.',
        )
      throw error
    }

    if (!restFixture) {
      await inngestFixture.teardown()
      SharedMessagingModuleFixture.restoreEnvironment(
        originalServerAppMode,
        originalEmailProvider,
      )
      throw new Error('O fixture de Mensageria não foi registrado no Inngest.')
    }

    return new SharedMessagingModuleFixture(
      restFixture,
      inngestFixture,
      originalServerAppMode,
      originalEmailProvider,
    )
  }

  get<T>(typeOrToken: Type<T> | string | symbol): T {
    return this.restFixture.get(typeOrToken)
  }

  get database(): InngestTestDatabase {
    return this.inngestFixture.database
  }

  insertOutboxEvent(overrides: Parameters<InngestFixture['insertOutboxEvent']>[0] = {}) {
    return this.inngestFixture.insertOutboxEvent(overrides)
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    return this.inngestFixture.functionOptions
  }

  invokeInngest(data?: Record<string, unknown>) {
    return this.inngestFixture.invoke(data)
  }

  runInngest(event: EventPayload) {
    return this.inngestFixture.run(event)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close(): Promise<void> {
    const errors: unknown[] = []
    try {
      await this.inngestFixture.teardown()
    } catch (error) {
      errors.push(error)
    }
    try {
      await this.restFixture.close()
    } catch (error) {
      errors.push(error)
    } finally {
      SharedMessagingModuleFixture.restoreEnvironment(
        this.originalServerAppMode,
        this.originalEmailProvider,
      )
    }
    if (errors.length > 0)
      throw new AggregateError(errors, 'Failed to close the shared job fixture.')
  }

  private static restoreEnvironment(
    originalServerAppMode: string | undefined,
    originalEmailProvider: string | undefined,
  ) {
    SharedMessagingModuleFixture.restoreEnvironmentVariable(
      'SCOOPS_SERVER_APP_MODE',
      originalServerAppMode,
    )
    SharedMessagingModuleFixture.restoreEnvironmentVariable(
      'SCOOPS_EMAIL_PROVIDER',
      originalEmailProvider,
    )
  }

  private static restoreEnvironmentVariable(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
