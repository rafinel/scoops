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
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import { AppModule } from '@/app.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { parseSeedEnv } from '@/shared/database/seed-env'

const SEED_ESTABLISHMENT_ID = '00000000-0000-4000-8000-000000000001'
const SEED_TIMESTAMP = new Date('2026-01-01T00:00:00.000Z')
const SEED_PASSWORD = '12345678'
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

const SEED_PRODUCTS = [
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí base',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 20,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Leite condensado',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.ByBrand,
    status: ProductStatus.Active,
    idealStock: 12,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Granola',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Accompaniment],
    stockControl: ProductStockControl.ByBrand,
    status: ProductStatus.Active,
    idealStock: 8,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Banana fatiada',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Accompaniment],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 5,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Creme de avelã',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
    stockControl: ProductStockControl.ByBrand,
    status: ProductStatus.Active,
    idealStock: 6,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Copo 300 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Resale],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 100,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tradicional 300 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Manufacturable],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 30,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tradicional 500 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Manufacturable],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 20,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Calda de chocolate',
    unit: ProductUnit.Liter,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.ByBrand,
    status: ProductStatus.Inactive,
    idealStock: 4,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Morango',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 10,
  },
] as const

async function seedDatabase() {
  let app: INestApplicationContext | undefined

  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    })
    parseSeedEnv()
    const envProvider = app.get(EnvProvider)
    const identitySeeder = app.get(IdentitySeeder)
    const mrpSeeder = app.get(MrpSeeder)

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
    await mrpSeeder.clear()
    await mrpSeeder.run([...SEED_PRODUCTS])
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

  const users: Array<{ id: string }> = []
  let page = 1

  while (true) {
    const { data, error: listError } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (listError) throw listError

    users.push(...data.users)
    if (data.users.length < 1000) break
    page += 1
  }

  for (const user of users) {
    const { error } = await client.auth.admin.deleteUser(user.id)

    if (error) {
      throw error
    }
  }

  for (const seedUser of Object.values(SEED_USERS)) {
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

void seedDatabase().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
