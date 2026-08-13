import type { INestApplication, Type } from '@nestjs/common'
import type { AuthIdentityProvider } from '@scoops/core/identity/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentityModule } from '@/identity/identity.module'
import { SharedModule } from '@/shared/shared.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class IdentityModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly originalAnonKey: string | undefined,
  ) {}

  static async register(authIdentityProvider: AuthIdentityProvider) {
    const originalAnonKey = process.env.SUPABASE_ANON_KEY
    process.env.SUPABASE_ANON_KEY ??= 'test-anon-key'

    try {
      const restFixture = await RestFixture.register(
        {
          imports: [SharedModule, IdentityModule],
        },
        (builder: TestingModuleBuilder) =>
          builder
            .overrideProvider(IDENTITY_PROVIDERS.authIdentity)
            .useValue(authIdentityProvider),
      )

      return new IdentityModuleFixture(restFixture, originalAnonKey)
    } catch (error) {
      IdentityModuleFixture.restoreAnonKey(originalAnonKey)
      throw error
    }
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get seeder(): IdentitySeeder {
    return this.restFixture.get(IdentitySeeder)
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.restFixture.get(typeOrToken)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      IdentityModuleFixture.restoreAnonKey(this.originalAnonKey)
    }
  }

  private static restoreAnonKey(originalAnonKey: string | undefined) {
    if (originalAnonKey === undefined) {
      delete process.env.SUPABASE_ANON_KEY
    } else {
      process.env.SUPABASE_ANON_KEY = originalAnonKey
    }
  }
}
