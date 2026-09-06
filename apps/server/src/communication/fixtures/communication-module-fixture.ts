import type { INestApplication, Type } from '@nestjs/common'
import type { User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { NotificationCreate } from '@scoops/core/communication/domain/structures'
import type { NotificationsRepository } from '@scoops/core/communication/interfaces'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import type { Broker } from '@scoops/core/shared/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentityModule } from '@/identity/identity.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import { CommunicationModule } from '@/communication/communication.module'
import { CommunicationDatabaseModule } from '@/communication/database'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { COMMUNICATION_REPOSITORIES } from '@/communication/constants'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { SharedModule } from '@/shared/shared.module'
import { NotificationAudienceCompositionModule } from '@/composition/communication-identity'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

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

  private constructor(private readonly restFixture: RestFixture) {}

  static async register(
    authProvider: ServerAuthProvider,
    overrides: { broker?: Broker } = {},
  ) {
    const restFixture = await RestFixture.register(
      {
        imports: [
          SharedModule,
          NotificationAudienceCompositionModule,
          IdentityModule,
          CommunicationModule,
          CommunicationDatabaseModule,
          InngestModule.forRoot({ functions: [] }),
        ],
      },
      (builder: TestingModuleBuilder) =>
        builder
          .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
          .useValue(authProvider)
          .overrideProvider(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
          .useValue(authProvider)
          .overrideProvider(BetterAuthSessionIssuer)
          .useValue(authProvider)
          .overrideProvider(InngestBroker)
          .useValue(overrides.broker ?? new InngestMock()),
    )

    return new CommunicationModuleFixture(restFixture)
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get seeder(): CommunicationSeeder {
    return this.restFixture.get(CommunicationSeeder)
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.restFixture.get(typeOrToken)
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
    await this.get<IdentitySeeder>(IdentitySeeder).run({
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

  close() {
    return this.restFixture.close()
  }

  get notificationsRepository(): NotificationsRepository {
    return this.get<NotificationsRepository>(COMMUNICATION_REPOSITORIES.notifications)
  }
}
