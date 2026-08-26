import type { INestApplication, Type } from '@nestjs/common'
import type { User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import type { SalesChannel, SalesChannelCreate } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelsRepository } from '@scoops/core/pdv/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { IdentityModule } from '@/identity/identity.module'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'
import { PdvModule } from '@/pdv/pdv.module'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
import { SharedModule } from '@/shared/shared.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class PdvModuleFixture {
  static readonly accounts = {
    establishmentId: '43000000-0000-0000-0000-000000000001',
    managerId: '43000000-0000-0000-0000-000000000002',
    managerToken: 'pdv-manager-token',
    operatorId: '43000000-0000-0000-0000-000000000003',
    operatorToken: 'pdv-operator-token',
    foreignEstablishmentId: '44000000-0000-0000-0000-000000000001',
    foreignManagerId: '44000000-0000-0000-0000-000000000002',
    foreignManagerToken: 'pdv-foreign-manager-token',
  } as const

  private constructor(private readonly restFixture: RestFixture) {}

  static async register(authProvider: ServerAuthProvider) {
    const restFixture = await RestFixture.register(
      {
        imports: [
          SharedModule,
          IdentityModule,
          PdvModule,
          InngestModule.forRoot({ functions: [] }),
        ],
      },
      (builder: TestingModuleBuilder) =>
        builder
          .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
          .useValue(authProvider)
          .overrideProvider(InngestBroker)
          .useValue(new InngestMock()),
    )

    return new PdvModuleFixture(restFixture)
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.restFixture.get<T>(typeOrToken)
  }

  get salesChannels(): SalesChannelsRepository {
    return this.get(PDV_REPOSITORIES.salesChannels)
  }

  get seeder(): PdvSeeder {
    return this.get(PdvSeeder)
  }

  async resetDatabase() {
    await this.restFixture.resetDatabase()
  }

  async seedAccounts() {
    const ids = PdvModuleFixture.accounts
    const users: User[] = [
      UserFaker.fake({
        id: ids.managerId,
        establishmentId: ids.establishmentId,
        name: 'Maria Manager',
        email: 'pdv.manager@example.com',
        profile: UserProfile.Manager,
      }),
      UserFaker.fake({
        id: ids.operatorId,
        establishmentId: ids.establishmentId,
        name: 'Otavio Operator',
        email: 'pdv.operator@example.com',
        profile: UserProfile.Operator,
      }),
      UserFaker.fake({
        id: ids.foreignManagerId,
        establishmentId: ids.foreignEstablishmentId,
        name: 'Foreign Manager',
        email: 'pdv.foreign@example.com',
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
    await this.seeder.run()
    return users
  }

  authenticate(setUser: (token: string, user: { id: string; email: string }) => void) {
    const ids = PdvModuleFixture.accounts
    setUser(ids.managerToken, { id: ids.managerId, email: 'pdv.manager@example.com' })
    setUser(ids.operatorToken, { id: ids.operatorId, email: 'pdv.operator@example.com' })
    setUser(ids.foreignManagerToken, {
      id: ids.foreignManagerId,
      email: 'pdv.foreign@example.com',
    })
  }

  addSalesChannel(input: SalesChannelCreate): Promise<SalesChannel> {
    return this.salesChannels.add(input)
  }

  close() {
    return this.restFixture.close()
  }
}

export async function preparePdvFixture() {
  const auth = new SupabaseAuthFixture()
  const fixture = await PdvModuleFixture.register(auth)
  return { auth, fixture }
}

export async function resetPdvFixture(
  fixture: PdvModuleFixture,
  auth: SupabaseAuthFixture,
) {
  await auth.clear()
  await fixture.resetDatabase()
  await fixture.seedAccounts()
  fixture.authenticate(auth.setUser.bind(auth))
}

export function managerRequestAuthorization() {
  return `Bearer ${PdvModuleFixture.accounts.managerToken}`
}

export function operatorRequestAuthorization() {
  return `Bearer ${PdvModuleFixture.accounts.operatorToken}`
}

export function foreignManagerRequestAuthorization() {
  return `Bearer ${PdvModuleFixture.accounts.foreignManagerToken}`
}

export function salesChannelCreate(
  overrides: Partial<SalesChannelCreate> = {},
): SalesChannelCreate {
  return {
    establishmentId: PdvModuleFixture.accounts.establishmentId,
    name: 'Delivery próprio',
    percentage: 12.5,
    status: 'active',
    ...overrides,
  }
}
