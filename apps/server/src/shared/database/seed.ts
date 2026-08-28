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
import type {
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
} from '@scoops/core/mrp/interfaces'
import type { ComboCreate } from '@scoops/core/pdv/domain/structures'

import { AppModule } from '@/app.module'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'
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

const SEED_ACCOMPANIMENT_TYPES = [
  { establishmentId: SEED_ESTABLISHMENT_ID, name: 'Caldas' },
  { establishmentId: SEED_ESTABLISHMENT_ID, name: 'Frutas' },
  { establishmentId: SEED_ESTABLISHMENT_ID, name: 'Granolas' },
  { establishmentId: SEED_ESTABLISHMENT_ID, name: 'Complementos' },
] as const

const SEED_PRODUCT_ACCOMPANIMENTS = [
  {
    productName: 'Açaí tradicional',
    accompanimentProductName: 'Granola',
    accompanimentTypeName: 'Granolas',
    quantityPerPortion: 0.05,
  },
  {
    productName: 'Açaí tradicional',
    accompanimentProductName: 'Banana fatiada',
    accompanimentTypeName: 'Frutas',
    quantityPerPortion: 0.08,
  },
  {
    productName: 'Açaí tradicional',
    accompanimentProductName: 'Creme de avelã',
    accompanimentTypeName: 'Complementos',
    quantityPerPortion: 0.03,
  },
  {
    productName: 'Açaí tradicional',
    accompanimentProductName: 'Calda de chocolate',
    accompanimentTypeName: 'Caldas',
    quantityPerPortion: 0.02,
  },
  {
    productName: 'Açaí tropical',
    accompanimentProductName: 'Granola',
    accompanimentTypeName: 'Granolas',
    quantityPerPortion: 0.05,
  },
  {
    productName: 'Açaí tropical',
    accompanimentProductName: 'Morango',
    accompanimentTypeName: 'Frutas',
    quantityPerPortion: 0.08,
  },
  {
    productName: 'Açaí tropical',
    accompanimentProductName: 'Creme de avelã',
    accompanimentTypeName: 'Complementos',
    quantityPerPortion: 0.03,
  },
  {
    productName: 'Açaí tropical',
    accompanimentProductName: 'Calda de chocolate',
    accompanimentTypeName: 'Caldas',
    quantityPerPortion: 0.02,
  },
] as const

const SEED_PRODUCTS = [
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí base',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 20,
    initialStock: 100,
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
    stockControl: ProductStockControl.ByBrand,
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
    initialStock: 500,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Copo 500 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Resale],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 80,
    initialStock: 300,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Água mineral 500 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Resale],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 60,
    initialStock: 200,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tradicional 300 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Manufacturable],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 30,
    initialStock: 100,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tradicional 500 ml',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Manufacturable],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 20,
    initialStock: 80,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tradicional',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Manufacturable, ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 30,
    initialStock: 60,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí tropical',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Manufacturable, ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 20,
    initialStock: 45,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Sorvete de morango',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Manufacturable, ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 18,
    initialStock: 40,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Açaí kids',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Manufacturable, ProductCategory.Portion],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    idealStock: 15,
    initialStock: 35,
  },
  {
    establishmentId: SEED_ESTABLISHMENT_ID,
    name: 'Calda de chocolate',
    unit: ProductUnit.Liter,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.ByBrand,
    status: ProductStatus.Active,
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
    initialStock: 40,
  },
] as const

const SEED_BRANDS = [
  {
    productName: 'Leite condensado',
    name: 'Moça',
    packageQuantity: 1,
    packagePrice: 8.5,
    isPrimary: true,
    initialStock: 40,
  },
  {
    productName: 'Leite condensado',
    name: 'Itambé',
    packageQuantity: 1,
    packagePrice: 8,
    isPrimary: false,
    initialStock: 20,
  },
  {
    productName: 'Granola',
    name: 'Granola tradicional',
    packageQuantity: 1,
    packagePrice: 16,
    isPrimary: true,
    initialStock: 50,
  },
  {
    productName: 'Banana fatiada',
    name: 'Banana premium',
    packageQuantity: 1,
    packagePrice: 9,
    isPrimary: true,
    initialStock: 30,
  },
  {
    productName: 'Creme de avelã',
    name: 'Nutella',
    packageQuantity: 0.35,
    packagePrice: 22,
    isPrimary: true,
    initialStock: 40,
  },
  {
    productName: 'Calda de chocolate',
    name: "Hershey's",
    packageQuantity: 1,
    packagePrice: 18,
    isPrimary: true,
    initialStock: 25,
  },
] as const

const SEED_COMBO_DEFINITIONS = [
  {
    name: 'Combo Açaí Clássico',
    status: 'active',
    fixedPrice: 32.5,
    components: [
      {
        productName: 'Açaí tradicional',
        sizeName: '300 g',
        accompanimentProductNames: ['Granola', 'Banana fatiada'],
      },
      {
        productName: 'Açaí tropical',
        sizeName: '300 g',
        accompanimentProductNames: ['Granola', 'Calda de chocolate'],
      },
    ],
  },
  {
    name: 'Combo Açaí Família',
    status: 'inactive',
    fixedPrice: 48.9,
    components: [
      {
        productName: 'Açaí tradicional',
        sizeName: '500 g',
        accompanimentProductNames: ['Granola', 'Creme de avelã'],
      },
      {
        productName: 'Açaí tropical',
        sizeName: '500 g',
        accompanimentProductNames: ['Granola', 'Calda de chocolate'],
      },
    ],
  },
] as const

async function buildSeedCombos(app: INestApplicationContext): Promise<ComboCreate[]> {
  const productsRepository = app.get<ProductsRepository>(MRP_REPOSITORIES.products)
  const productSizesRepository = app.get<ProductSizesRepository>(
    MRP_REPOSITORIES.productSizes,
  )
  const productAccompanimentsRepository = app.get<ProductAccompanimentsRepository>(
    MRP_REPOSITORIES.productAccompaniments,
  )

  async function findProduct(productName: string) {
    const product = await productsRepository.findByName(
      SEED_ESTABLISHMENT_ID,
      productName,
    )
    if (!product) {
      throw new AppError(
        `O produto do combo seed ${productName} não foi encontrado.`,
        'Seed PDV inválido',
      )
    }
    return product
  }

  return Promise.all(
    SEED_COMBO_DEFINITIONS.map(async (comboDefinition) => {
      const components = await Promise.all(
        comboDefinition.components.map(async (component) => {
          const product = await findProduct(component.productName)
          const sizes = await productSizesRepository.findManyByProductId(
            SEED_ESTABLISHMENT_ID,
            product.id,
          )
          const size = sizes.find((candidate) => candidate.name === component.sizeName)
          if (!size?.isActive) {
            throw new AppError(
              `O tamanho ${component.sizeName} do combo seed ${comboDefinition.name} não foi encontrado ou está inativo.`,
              'Seed PDV inválido',
            )
          }

          const links = await productAccompanimentsRepository.findManyByProductId(
            SEED_ESTABLISHMENT_ID,
            product.id,
          )
          const accompanimentIds = await Promise.all(
            component.accompanimentProductNames.map(async (accompanimentProductName) => {
              const accompanimentProduct = await findProduct(accompanimentProductName)
              const link = links.find(
                (candidate) =>
                  candidate.accompanimentProductId === accompanimentProduct.id,
              )
              if (!link) {
                throw new AppError(
                  `O acompanhamento ${accompanimentProductName} não está vinculado ao produto ${component.productName} do combo seed.`,
                  'Seed PDV inválido',
                )
              }
              return link.id
            }),
          )

          return {
            kind: 'portion' as const,
            productId: product.id,
            quantity: 1,
            sizeId: size.id,
            accompanimentIds,
          }
        }),
      )

      return {
        establishmentId: SEED_ESTABLISHMENT_ID,
        name: comboDefinition.name,
        status: comboDefinition.status,
        fixedPrice: comboDefinition.fixedPrice,
        components,
      }
    }),
  )
}

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
    const pdvSeeder = app.get(PdvSeeder)

    await resetSeedUsers(envProvider)
    await verifySeedUsers(envProvider)
    await identitySeeder.clear()
    await mrpSeeder.clear()
    await pdvSeeder.clear()
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
    await mrpSeeder.run({
      accompanimentTypes: [...SEED_ACCOMPANIMENT_TYPES],
      products: [...SEED_PRODUCTS],
      brands: [...SEED_BRANDS],
      resaleConfigurations: [
        {
          productName: 'Copo 300 ml',
          price: 4.5,
          isActive: true,
        },
        {
          productName: 'Creme de avelã',
          brandName: 'Nutella',
          price: 75,
          isActive: true,
        },
        {
          productName: 'Copo 500 ml',
          price: 6.5,
          isActive: true,
        },
        {
          productName: 'Água mineral 500 ml',
          price: 3.5,
          isActive: true,
        },
      ],
      stockBalances: [],
      productSizes: [
        {
          productName: 'Açaí tradicional',
          name: '300 g',
          quantity: 0.3,
          price: 18,
          isActive: true,
        },
        {
          productName: 'Açaí tradicional',
          name: '500 g',
          quantity: 0.5,
          price: 27,
          isActive: true,
        },
        {
          productName: 'Açaí tropical',
          name: '300 g',
          quantity: 0.3,
          price: 21,
          isActive: true,
        },
        {
          productName: 'Açaí tropical',
          name: '500 g',
          quantity: 0.5,
          price: 31,
          isActive: true,
        },
        {
          productName: 'Sorvete de morango',
          name: '200 g',
          quantity: 0.2,
          price: 14,
          isActive: true,
        },
        {
          productName: 'Sorvete de morango',
          name: '400 g',
          quantity: 0.4,
          price: 24,
          isActive: true,
        },
        {
          productName: 'Açaí kids',
          name: '200 g',
          quantity: 0.2,
          price: 13,
          isActive: true,
        },
        {
          productName: 'Açaí kids',
          name: '300 g',
          quantity: 0.3,
          price: 18,
          isActive: true,
        },
      ],
      productAccompaniments: [...SEED_PRODUCT_ACCOMPANIMENTS],
    })
    await pdvSeeder.run({ combos: await buildSeedCombos(app) })
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
