import 'reflect-metadata'

import { createClient } from '@supabase/supabase-js'
import { NestFactory } from '@nestjs/core'
import type { INestApplicationContext } from '@nestjs/common'
import { AppError } from '@scoops/core/shared/domain/errors'
import {
  EstablishmentStatus,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'

import { AppModule } from '@/app.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { parseSeedEnv } from '@/shared/database/seed-env'

const SEED_ESTABLISHMENT_ID = '00000000-0000-4000-8000-000000000001'
const SEED_TIMESTAMP = new Date('2026-01-01T00:00:00.000Z')
const SEED_PASSWORD = '123456'
const SEED_USERS = {
  manager: {
    id: '3d2396d2-b747-45cb-bb4a-89b25ed6b457',
    email: 'manager.seed@scoops.com',
    name: 'Scoops Manager',
    profile: UserProfile.Manager,
  },
  operator: {
    id: '6fe71e88-eedc-44f8-aae5-3439b5495e8f',
    email: 'operator.seed@scoops.com',
    name: 'Scoops Operator',
    profile: UserProfile.Operator,
  },
} as const

async function seedDatabase() {
  let app: INestApplicationContext | undefined

  try {
    parseSeedEnv()
    app = await NestFactory.createApplicationContext(AppModule, { logger: false })
    const envProvider = app.get(EnvProvider)
    const identitySeeder = app.get(IdentitySeeder)

    await resetSeedUsers(envProvider)
    await verifySeedUsers(envProvider)
    await identitySeeder.clear()
    await identitySeeder.run({
      establishments: [
        {
          id: SEED_ESTABLISHMENT_ID,
          name: 'Scoops Seed Establishment',
          status: EstablishmentStatus.Active,
          createdAt: SEED_TIMESTAMP,
          updatedAt: SEED_TIMESTAMP,
        },
      ],
      users: [
        {
          id: SEED_USERS.manager.id,
          establishmentId: SEED_ESTABLISHMENT_ID,
          name: SEED_USERS.manager.name,
          email: SEED_USERS.manager.email,
          profile: SEED_USERS.manager.profile,
          status: UserStatus.Active,
          createdAt: SEED_TIMESTAMP,
          updatedAt: SEED_TIMESTAMP,
        },
        {
          id: SEED_USERS.operator.id,
          establishmentId: SEED_ESTABLISHMENT_ID,
          name: SEED_USERS.operator.name,
          email: SEED_USERS.operator.email,
          profile: SEED_USERS.operator.profile,
          status: UserStatus.Active,
          createdAt: SEED_TIMESTAMP,
          updatedAt: SEED_TIMESTAMP,
        },
      ],
      registrationAttempts: [],
    })
  } finally {
    await app?.close()
  }
}

async function verifySeedUsers(envProvider: EnvProvider) {
  const client = createClient(
    envProvider.get('SUPABASE_URL'),
    envProvider.get('SUPABASE_ANON_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )

  for (const seedUser of Object.values(SEED_USERS)) {
    const { data, error } = await client.auth.signInWithPassword({
      email: seedUser.email,
      password: SEED_PASSWORD,
    })

    if (error || data.user?.id !== seedUser.id) {
      throw new AppError(
        `O usuário Supabase Auth ${seedUser.email} não corresponde ao UUID seed configurado.`,
        'Usuário seed inválido',
      )
    }
  }

  await client.auth.signOut({ scope: 'local' })
}

async function resetSeedUsers(envProvider: EnvProvider): Promise<void> {
  const client = createClient(
    envProvider.get('SUPABASE_URL'),
    envProvider.get('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )

  const { data, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw listError
  }

  for (const seedUser of Object.values(SEED_USERS)) {
    const usersToDelete = data.users.filter(
      (user) => user.id === seedUser.id || user.email === seedUser.email,
    )

    for (const user of usersToDelete) {
      const { error } = await client.auth.admin.deleteUser(user.id)

      if (error) {
        throw error
      }
    }

    const { error } = await client.auth.admin.createUser({
      id: seedUser.id,
      email: seedUser.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: seedUser.name,
      },
    })

    if (error) {
      throw error
    }
  }
}

void seedDatabase()
