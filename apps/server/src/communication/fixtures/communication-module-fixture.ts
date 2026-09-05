import { randomUUID } from 'node:crypto'

import type { INestApplication, Type } from '@nestjs/common'
import type { EventPayload, InngestFunction } from 'inngest'
import type { EmailMessage } from '@scoops/core/communication/domain/structures'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'

import { CommunicationModule } from '@/communication/communication.module'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type InngestJobType<T extends InngestJob> = Type<T> & {
  readonly ID: string
}

type MailpitSummary = {
  readonly ID: string
  readonly To: readonly { readonly Address: string }[]
}

type MailpitMessage = MailpitSummary & {
  readonly Subject: string
  readonly MessageID: string
  readonly HTML: string
  readonly Text: string
}

type MailpitListResponse = {
  readonly messages: readonly MailpitSummary[]
}

type IdProvider = {
  generate(): string
}

export class CommunicationModuleFixture {
  private readonly mailpitBaseUrl = 'http://127.0.0.1:54324'

  private constructor(
    private readonly restFixture: RestFixture,
    private readonly inngestFixture: InngestFixture,
    private readonly originalEmailEnvironment: Readonly<{
      provider: string | undefined
      host: string | undefined
      port: string | undefined
      from: string | undefined
    }>,
  ) {}

  static async register<T extends InngestJob>(options: {
    readonly inngestJob: InngestJobType<T>
  }) {
    const originalEmailEnvironment = {
      provider: process.env.SCOOPS_EMAIL_PROVIDER,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      from: process.env.EMAIL_FROM,
    }
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'
    process.env.SMTP_HOST = '127.0.0.1'
    process.env.SMTP_PORT = '54325'
    process.env.EMAIL_FROM = 'no-reply@scoops.local'

    let restFixture: RestFixture | undefined
    const inngestFixture = new InngestFixture({
      functionId: options.inngestJob.ID,
      createJob: async (client) => {
        restFixture = await RestFixture.register(
          { imports: [CommunicationModule] },
          (builder) => builder.overrideProvider(InngestClient).useValue(client),
        )
        return restFixture.get(options.inngestJob)
      },
    })

    try {
      await inngestFixture.setup()
    } catch (error) {
      try {
        await restFixture?.close()
      } finally {
        CommunicationModuleFixture.restoreEmailEnvironment(originalEmailEnvironment)
      }
      throw error
    }

    if (!restFixture) {
      await inngestFixture.teardown()
      CommunicationModuleFixture.restoreEmailEnvironment(originalEmailEnvironment)
      throw new Error('The Communication fixture was not registered for Inngest.')
    }

    return new CommunicationModuleFixture(
      restFixture,
      inngestFixture,
      originalEmailEnvironment,
    )
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get datetimeProvider(): DatetimeProvider {
    return this.restFixture.get(DatetimeProvider)
  }

  get idProvider(): IdProvider {
    return { generate: randomUUID }
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    return this.inngestFixture.functionOptions
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  runInngest(event: EventPayload) {
    return this.inngestFixture.run(event)
  }

  async waitForEmail(to: EmailMessage['to']): Promise<MailpitMessage> {
    const deadline = Date.now() + 60_000

    while (Date.now() < deadline) {
      const message = await this.findEmail(to)
      if (message) return message

      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    throw new Error(`Timed out waiting for Mailpit message to ${to}.`)
  }

  async findEmail(to: EmailMessage['to']): Promise<MailpitMessage | undefined> {
    const response = await fetch(`${this.mailpitBaseUrl}/api/v1/messages`)
    if (!response.ok) return undefined

    const body = (await response.json()) as MailpitListResponse
    const summary = body.messages.find((message) =>
      message.To.some((recipient) => recipient.Address === to),
    )
    if (!summary) return undefined

    const messageResponse = await fetch(
      `${this.mailpitBaseUrl}/api/v1/message/${summary.ID}`,
    )
    if (!messageResponse.ok) return undefined

    return (await messageResponse.json()) as MailpitMessage
  }

  async close() {
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
      CommunicationModuleFixture.restoreEmailEnvironment(this.originalEmailEnvironment)
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to close the Communication fixture.')
    }
  }

  private static restoreEmailEnvironment(environment: {
    readonly provider: string | undefined
    readonly host: string | undefined
    readonly port: string | undefined
    readonly from: string | undefined
  }) {
    CommunicationModuleFixture.restoreEnvironmentVariable(
      'SCOOPS_EMAIL_PROVIDER',
      environment.provider,
    )
    CommunicationModuleFixture.restoreEnvironmentVariable('SMTP_HOST', environment.host)
    CommunicationModuleFixture.restoreEnvironmentVariable('SMTP_PORT', environment.port)
    CommunicationModuleFixture.restoreEnvironmentVariable('EMAIL_FROM', environment.from)
  }

  private static restoreEnvironmentVariable(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
