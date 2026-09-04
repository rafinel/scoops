import type { INestApplication, Type } from '@nestjs/common'
import request from 'supertest'
import type { User } from '@scoops/core/identity/domain/entities'
import {
  EstablishmentFaker,
  UserFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import type {
  AccompanimentType,
  Brand,
  BrandCreate,
  Product,
  ProductAccompaniment,
  ProductSize,
  ResaleConfiguration,
} from '@scoops/core/mrp/domain/entities'
import type {
  AccompanimentTypeCreate,
  ProductAccompanimentCreate,
  ProductCreate,
  ProductSizeCreate,
  ResaleConfigurationCreate,
} from '@scoops/core/mrp/domain/structures'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
} from '@scoops/core/mrp/interfaces'
import type {
  Order,
  SalesChannel,
  SalesChannelCreate,
} from '@scoops/core/pdv/domain/entities'
import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { ComboCreate } from '@scoops/core/pdv/domain/structures'
import type { AppError } from '@scoops/core/shared/domain/errors'
import type { StockTransactionsRepository } from '@scoops/core/mrp/interfaces'
import type {
  DiscountsRepository,
  OrdersRepository,
  PdvDatabase,
  PdvDatabaseScope,
  SalesChannelsRepository,
} from '@scoops/core/pdv/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'
import { eq } from 'drizzle-orm'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IdentityModule } from '@/identity/identity.module'
import { MRP_PROVIDERS, MRP_REPOSITORIES } from '@/mrp/constants'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { MrpModule } from '@/mrp/mrp.module'
import { TransactionBoundOrderRegistrationDependenciesFactory } from '@/mrp/provision/pdv/transaction-bound-order-registration-dependencies-factory'
import { PDV_REPOSITORIES } from '@/pdv/constants'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'
import { DrizzlePdvDatabase } from '@/pdv/database/drizzle/repositories/drizzle-pdv-database'
import { PdvModule } from '@/pdv/pdv.module'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { SharedModule } from '@/shared/shared.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { orderModel } from '@/pdv/database/drizzle/models/order-model'
import { orderSequenceModel } from '@/pdv/database/drizzle/models/order-sequence-model'

type RegisterPortionOrderInput = {
  readonly authorization: string
  readonly establishmentId?: string
  readonly productName: string
  readonly idempotencyKey: string
  readonly channelId?: string
  readonly quantity?: number
  readonly stockQuantity?: number
}

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

  private constructor(
    private readonly restFixture: RestFixture,
    private readonly originalPreviewTokenSecret: string | undefined,
    private readonly stockConsumerFailure: { error?: AppError },
    private readonly stockRestorerFailure: { error?: AppError },
    private readonly databaseFailure: { error?: AppError },
  ) {}

  static async register(authProvider: ServerAuthProvider) {
    const originalPreviewTokenSecret = process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET
    process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET ??=
      'pdv-test-preview-token-secret-0123456789'
    const stockConsumerFailure: { error?: AppError } = {}
    const stockRestorerFailure: { error?: AppError } = {}
    const databaseFailure: { error?: AppError } = {}
    const restFixture = await RestFixture.register(
      {
        imports: [
          SharedModule,
          IdentityModule,
          MrpModule,
          PdvModule,
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
          .useValue(new InngestMock())
          .overrideProvider(MRP_PROVIDERS.orderRegistrationDependencies)
          .useFactory({
            inject: [TransactionBoundOrderRegistrationDependenciesFactory],
            factory: (factory: TransactionBoundOrderRegistrationDependenciesFactory) => ({
              forExecutor: (executor: Parameters<typeof factory.forExecutor>[0]) => {
                const dependencies = factory.forExecutor(executor)
                return {
                  ...dependencies,
                  stockConsumer: {
                    consume: async (
                      ...args: Parameters<typeof dependencies.stockConsumer.consume>
                    ) => {
                      if (stockConsumerFailure.error) throw stockConsumerFailure.error
                      return dependencies.stockConsumer.consume(...args)
                    },
                  },
                  stockRestorer: {
                    restore: async (
                      ...args: Parameters<typeof dependencies.stockRestorer.restore>
                    ) => {
                      const restorations = await dependencies.stockRestorer.restore(
                        ...args,
                      )
                      if (stockRestorerFailure.error) throw stockRestorerFailure.error
                      return restorations
                    },
                  },
                }
              },
            }),
          })
          .overrideProvider(PDV_REPOSITORIES.database)
          .useFactory({
            inject: [DrizzlePdvDatabase],
            factory: (database: DrizzlePdvDatabase): PdvDatabase => ({
              run<Result>(operation: (scope: PdvDatabaseScope) => Promise<Result>) {
                return database.run(async (scope) => {
                  const result = await operation(scope)
                  if (databaseFailure.error) throw databaseFailure.error
                  return result
                })
              },
            }),
          }),
    )

    return new PdvModuleFixture(
      restFixture,
      originalPreviewTokenSecret,
      stockConsumerFailure,
      stockRestorerFailure,
      databaseFailure,
    )
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

  get broker(): InngestMock {
    return this.get(InngestBroker) as unknown as InngestMock
  }

  get mrpSeeder(): MrpSeeder {
    return this.get(MrpSeeder)
  }

  get products(): ProductsRepository {
    return this.get(MRP_REPOSITORIES.products)
  }

  get productSizes(): ProductSizesRepository {
    return this.get(MRP_REPOSITORIES.productSizes)
  }

  get resaleConfigurations(): ResaleConfigurationsRepository {
    return this.get(MRP_REPOSITORIES.resaleConfigurations)
  }

  get stockBalances(): StockBalancesRepository {
    return this.get(MRP_REPOSITORIES.stockBalances)
  }

  get brands(): BrandsRepository {
    return this.get(MRP_REPOSITORIES.brands)
  }

  get accompanimentTypes(): AccompanimentTypesRepository {
    return this.get(MRP_REPOSITORIES.accompanimentTypes)
  }

  get productAccompaniments(): ProductAccompanimentsRepository {
    return this.get(MRP_REPOSITORIES.productAccompaniments)
  }

  get discounts(): DiscountsRepository {
    return this.get(PDV_REPOSITORIES.discounts)
  }

  get orders(): OrdersRepository {
    return this.get(PDV_REPOSITORIES.orders)
  }

  get stockTransactions(): StockTransactionsRepository {
    return this.get(MRP_STOCK_TRANSACTIONS_REPOSITORY)
  }

  async getOrderSequenceNumber(establishmentId: string): Promise<number | undefined> {
    const [record] = await this.get(DrizzleClient)
      .requireDatabase()
      .select({ lastSequenceNumber: orderSequenceModel.lastSequenceNumber })
      .from(orderSequenceModel)
      .where(eq(orderSequenceModel.establishmentId, establishmentId))
      .limit(1)
    return record?.lastSequenceNumber
  }

  async setOrderCreatedAt(orderId: string, createdAt: Date) {
    await this.get(DrizzleClient)
      .requireDatabase()
      .update(orderModel)
      .set({ createdAt })
      .where(eq(orderModel.id, orderId))
  }

  setStockConsumerFailure(error?: AppError) {
    this.stockConsumerFailure.error = error
  }

  setStockRestorerFailure(error?: AppError) {
    this.stockRestorerFailure.error = error
  }

  setDatabaseFailure(error?: AppError) {
    this.databaseFailure.error = error
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
    await this.mrpSeeder.run()
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

  addProduct(input: ProductCreate): Promise<Product> {
    return this.products.add(input)
  }

  addProductSize(input: ProductSizeCreate): Promise<ProductSize> {
    return this.productSizes.add(input)
  }

  addResaleConfiguration(input: ResaleConfigurationCreate): Promise<ResaleConfiguration> {
    return this.resaleConfigurations.add(input)
  }

  addBrand(input: BrandCreate): Promise<Brand> {
    return this.brands.add(input)
  }

  addAccompanimentType(input: AccompanimentTypeCreate): Promise<AccompanimentType> {
    return this.accompanimentTypes.add(input)
  }

  addProductAccompaniment(
    input: ProductAccompanimentCreate,
  ): Promise<ProductAccompaniment> {
    return this.productAccompaniments.add(input)
  }

  addCombo(input: ComboCreate): Promise<Combo> {
    return this.discounts.add(input)
  }

  async registerPortionOrder(
    input: RegisterPortionOrderInput,
  ): Promise<{ product: Product; size: ProductSize; order: Order }> {
    const product = await this.addProduct({
      establishmentId: input.establishmentId ?? PdvModuleFixture.accounts.establishmentId,
      name: input.productName,
      unit: 'un',
      categories: ['portion'],
      stockControl: 'single',
      status: 'active',
      allowNegativeStock: false,
      idealStock: 0,
      currentUnitCost: 2,
    })
    const size = await this.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Regular',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await this.stockBalances.initialize(product.id)
    await this.stockBalances.add({ productId: product.id }, input.stockQuantity ?? 100)

    const lines = [
      {
        productId: product.id,
        kind: 'portion' as const,
        quantity: input.quantity ?? 1,
        sizeId: size.id,
        accompanimentIds: [],
      },
    ]
    const preview = await request(this.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', input.authorization)
      .send({
        ...(input.channelId ? { channelId: input.channelId } : {}),
        lines,
      })
    const response = await request(this.app.getHttpServer())
      .post('/orders')
      .set('Cookie', input.authorization)
      .send({
        idempotencyKey: input.idempotencyKey,
        previewToken: preview.body.previewToken,
        ...(input.channelId ? { channelId: input.channelId } : {}),
        lines,
      })

    return { product, size, order: response.body.order as Order }
  }

  close() {
    return this.restFixture.close().finally(() => {
      if (this.originalPreviewTokenSecret === undefined) {
        delete process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET
      } else {
        process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET = this.originalPreviewTokenSecret
      }
    })
  }
}

export async function preparePdvFixture() {
  const auth = new BetterAuthFixture()
  const fixture = await PdvModuleFixture.register(auth)
  return { auth, fixture }
}

export async function resetPdvFixture(
  fixture: PdvModuleFixture,
  auth: BetterAuthFixture,
) {
  await auth.clear()
  await fixture.resetDatabase()
  await fixture.seedAccounts()
  fixture.broker.events.length = 0
  fixture.setStockConsumerFailure()
  fixture.setStockRestorerFailure()
  fixture.setDatabaseFailure()
  fixture.authenticate(auth.setUser.bind(auth))
}

export function managerRequestAuthorization() {
  return `scoops.session_token=${PdvModuleFixture.accounts.managerToken}`
}

export function operatorRequestAuthorization() {
  return `scoops.session_token=${PdvModuleFixture.accounts.operatorToken}`
}

export function foreignManagerRequestAuthorization() {
  return `scoops.session_token=${PdvModuleFixture.accounts.foreignManagerToken}`
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
