import { randomUUID } from 'node:crypto'

import type { INestApplication, Type } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type { EventPayload, InngestFunction } from 'inngest'
import type {
  EmailMessage,
  NotificationCreate,
} from '@scoops/core/communication/domain/structures'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import type { User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'

import { CommunicationModule } from '@/communication/communication.module'
import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentityModule } from '@/identity/identity.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import { NotificationAudienceCompositionModule } from '@/composition/communication-identity'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SharedModule } from '@/shared/shared.module'

type InngestJobType<T extends InngestJob> = Type<T> & { readonly ID: string }

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
  static readonly accounts = {
    establishmentId: '61000000-0000-4000-8000-000000000001',
    managerId: '61000000-0000-4000-8000-000000000002',
    managerToken: 'communication-manager-token',
    operatorId: '61000000-0000-4000-8000-000000000003',
    operatorToken: 'communication-operator-token',
    foreignEstablishmentId: '62000000-0000-4000-8000-000000000001',
    foreignManagerId: '62000000-0000-4000-8000-000000000002',
    foreignManagerToken: 'communication-foreign-manager-token',
  } as const

  private readonly mailpitBaseUrl = 'http://127.0.0.1:54324'

  private constructor(
    private readonly restFixture: RestFixture,
    private readonly inngestFixture?: InngestFixture,
    private readonly originalEmailEnvironment?: Readonly<{
      provider: string | undefined
      host: string | undefined
      port: string | undefined
      from: string | undefined
    }>,
  ) {}

  static async register<T extends InngestJob>(options: {
    readonly inngestJob: InngestJobType<T>
  }): Promise<CommunicationModuleFixture>
  static async register(
    authProvider: ServerAuthProvider,
  ): Promise<CommunicationModuleFixture>
  static async register<T extends InngestJob>(
    optionsOrAuth: { readonly inngestJob: InngestJobType<T> } | ServerAuthProvider,
  ): Promise<CommunicationModuleFixture> {
    if ('inngestJob' in optionsOrAuth)
      return CommunicationModuleFixture.registerInngestJob(optionsOrAuth.inngestJob)

    const restFixture = await RestFixture.register(
      {
        imports: [
          SharedModule,
          NotificationAudienceCompositionModule,
          IdentityModule,
          CommunicationModule,
          InngestModule.forRoot({ functions: [] }),
        ],
      },
      (builder: TestingModuleBuilder) =>
        builder
          .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
          .useValue(optionsOrAuth)
          .overrideProvider(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
          .useValue(optionsOrAuth)
          .overrideProvider(BetterAuthSessionIssuer)
          .useValue(optionsOrAuth),
    )

    return new CommunicationModuleFixture(restFixture)
  }

  private static async registerInngestJob<T extends InngestJob>(
    inngestJob: InngestJobType<T>,
  ): Promise<CommunicationModuleFixture> {
    const originalEmailEnvironment = {
      provider: process.env.SCOOPS_EMAIL_PROVIDER,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      from: process.env.SCOOPS_EMAIL_SENDER,
    }
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'
    process.env.SMTP_HOST = '127.0.0.1'
    process.env.SMTP_PORT = '54325'
    process.env.SCOOPS_EMAIL_SENDER = 'no-reply@scoops.local'

    let restFixture: RestFixture | undefined
    const inngestFixture = new InngestFixture({
      functionId: inngestJob.ID,
      createJob: async (client) => {
        restFixture = await RestFixture.register(
          {
            imports: [
              SharedModule,
              NotificationAudienceCompositionModule,
              IdentityModule,
              CommunicationModule,
              InngestModule.forRoot({ functions: [] }),
            ],
          },
          (builder) => builder.overrideProvider(InngestClient).useValue(client),
        )
        return restFixture.get(inngestJob)
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
      throw new Error('O fixture de Comunicação não foi registrado no Inngest.')
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

  get<T>(typeOrToken: Type<T> | string | symbol): T {
    return this.restFixture.get(typeOrToken)
  }

  get datetimeProvider(): DatetimeProvider {
    return this.get(DatetimeProvider)
  }

  get idProvider(): IdProvider {
    return { generate: randomUUID }
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    if (!this.inngestFixture)
      throw new Error('O fixture de Comunicação não possui um job do Inngest.')
    return this.inngestFixture.functionOptions
  }

  get seeder(): CommunicationSeeder {
    return this.get(CommunicationSeeder)
  }

  async seedNotifications(notifications: NotificationCreate[]): Promise<void> {
    await this.seeder.run({ notifications })
  }

  async seedAccounts(): Promise<void> {
    const ids = CommunicationModuleFixture.accounts
    const users: User[] = [
      UserFaker.fake({
        id: ids.managerId,
        establishmentId: ids.establishmentId,
        name: 'Maria Manager',
        email: 'communication.manager@example.com',
        profile: UserProfile.Manager,
      }),
      UserFaker.fake({
        id: ids.operatorId,
        establishmentId: ids.establishmentId,
        name: 'Otavio Operator',
        email: 'communication.operator@example.com',
        profile: UserProfile.Operator,
      }),
      UserFaker.fake({
        id: ids.foreignManagerId,
        establishmentId: ids.foreignEstablishmentId,
        name: 'Foreign Manager',
        email: 'communication.foreign@example.com',
        profile: UserProfile.Manager,
      }),
    ]
    await this.get(IdentitySeeder).run({
      establishments: [
        EstablishmentFaker.fake({ id: ids.establishmentId, name: 'Scoops Centro' }),
        EstablishmentFaker.fake({
          id: ids.foreignEstablishmentId,
          name: 'Scoops Foreign',
        }),
      ],
      users,
      registrationAttempts: [],
    })
  }

  authenticate(setUser: (token: string, user: { id: string; email: string }) => void) {
    const ids = CommunicationModuleFixture.accounts
    setUser(ids.managerToken, {
      id: ids.managerId,
      email: 'communication.manager@example.com',
    })
    setUser(ids.operatorToken, {
      id: ids.operatorId,
      email: 'communication.operator@example.com',
    })
    setUser(ids.foreignManagerToken, {
      id: ids.foreignManagerId,
      email: 'communication.foreign@example.com',
    })
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture)
      throw new Error('O fixture de Comunicação não possui um job do Inngest.')
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

  get notificationsRepository(): NotificationsRepository {
    return this.get(COMMUNICATION_REPOSITORIES.notifications)
  }

  async close() {
    const errors: unknown[] = []

    try {
      await this.inngestFixture?.teardown()
    } catch (error) {
      errors.push(error)
    }

    try {
      await this.restFixture.close()
    } catch (error) {
      errors.push(error)
    } finally {
      if (this.originalEmailEnvironment)
        CommunicationModuleFixture.restoreEmailEnvironment(this.originalEmailEnvironment)
    }

    if (errors.length > 0)
      throw new AggregateError(errors, 'Failed to close the Communication fixture.')
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
    CommunicationModuleFixture.restoreEnvironmentVariable(
      'SCOOPS_EMAIL_SENDER',
      environment.from,
    )
  }

  private static restoreEnvironmentVariable(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}
