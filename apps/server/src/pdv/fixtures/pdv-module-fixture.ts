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
import type { Event } from '@scoops/core/shared/domain/events'
import type { EventsRepository } from '@scoops/core/shared/interfaces'
import type { StockTransactionsRepository } from '@scoops/core/mrp/interfaces'
import type {
  DiscountsRepository,
  OrdersRepository,
  PdvDatabase,
  PdvDatabaseRepositories,
  SalesChannelsRepository,
} from '@scoops/core/pdv/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'
import type { EventPayload, InngestFunction } from 'inngest'
import { eq } from 'drizzle-orm'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthSessionIssuer } from '@/identity/provision/auth'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { IdentityModule } from '@/identity/identity.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { MrpModule } from '@/mrp/mrp.module'
import { PDV_PROVIDERS, PDV_REPOSITORIES } from '@/pdv/constants'
import { PdvSeeder } from '@/pdv/database/pdv-seeder'
import { DrizzlePdvDatabase } from '@/pdv/database/drizzle/repositories/drizzle-pdv-database'
import { PdvModule } from '@/pdv/pdv.module'
import { MrpStockProvider } from '@/shared/provision/pdv-order-registration/mrp-stock-provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
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

type PortionOrderLine = {
  readonly productId: string
  readonly kind: 'portion'
  readonly quantity: number
  readonly sizeId: string
  readonly accompanimentIds: string[]
}

const PORTION_PRODUCT_DEFAULTS = {
  unit: 'un',
  categories: ['portion'],
  stockControl: 'single',
  status: 'active',
  allowNegativeStock: false,
  idealStock: 0,
  currentUnitCost: 2,
} as const

const REGULAR_PRODUCT_SIZE_DEFAULTS = {
  name: 'Regular',
  quantity: 1,
  price: 10,
  isActive: true,
} as const

const PORTION_ORDER_LINE_DEFAULTS = {
  kind: 'portion' as const,
  accompanimentIds: [] as string[],
}

const PDV_FIXTURE_IMPORTS = [
  SharedModule,
  IdentityModule,
  MrpModule,
  PdvModule,
  InngestModule.forRoot({ functions: [] }),
]

const IDENTITY_FIXTURE_AUTH_PROVIDERS = [
  IDENTITY_PROVIDERS.authIdentity,
  IDENTITY_PROVIDERS.betterAuthSessionVerifier,
  BetterAuthSessionIssuer,
]

type ConfigureFixture = (builder: TestingModuleBuilder) => TestingModuleBuilder

type InngestJobType<T extends InngestJob> = Type<T> & {
  readonly ID: string
}

type PdvModuleFixtureOptions<T extends InngestJob> = {
  readonly configure?: ConfigureFixture
  readonly inngestJob?: InngestJobType<T>
}

type CapturedEventsRepository = Pick<EventsRepository, 'add'> & {
  readonly events: Event[]
}

type PdvRestContext = {
  readonly restFixture: RestFixture
  readonly originalPreviewTokenSecret: string | undefined
  readonly stockConsumeFailure: { error?: AppError }
  readonly stockRestoreFailure: { error?: AppError }
  readonly databaseFailure: { error?: AppError }
  readonly eventsRepository: CapturedEventsRepository
}

type PdvRestSetup = {
  readonly authProvider: ServerAuthProvider
  readonly configure?: ConfigureFixture
  readonly databaseFailure: { error?: AppError }
  readonly eventsRepository: CapturedEventsRepository
  readonly inngestClient?: InngestClient
  readonly stockConsumeFailure: { error?: AppError }
  readonly stockRestoreFailure: { error?: AppError }
}

type PdvJobRegistration = {
  context?: PdvRestContext
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
    private readonly stockConsumeFailure: { error?: AppError },
    private readonly stockRestoreFailure: { error?: AppError },
    private readonly databaseFailure: { error?: AppError },
    private readonly inngestFixture: InngestFixture | undefined,
    private readonly eventsRepository: CapturedEventsRepository,
    private readonly originalServerAppMode?: string,
    private readonly originalEmailProvider?: string,
  ) {}

  static async register<T extends InngestJob = InngestJob>(
    authProvider: ServerAuthProvider,
    target?: ConfigureFixture | PdvModuleFixtureOptions<T>,
  ) {
    const options: PdvModuleFixtureOptions<T> =
      typeof target === 'function' ? { configure: target } : (target ?? {})

    if (options.inngestJob) {
      return PdvModuleFixture.registerWithInngest(
        authProvider,
        options,
        options.inngestJob,
      )
    }

    const context = await PdvModuleFixture.registerRestContext(
      authProvider,
      options.configure,
    )
    return PdvModuleFixture.fromRestContext(context)
  }

  private static async registerRestContext(
    authProvider: ServerAuthProvider,
    configure?: ConfigureFixture,
    inngestClient?: InngestClient,
  ) {
    const originalPreviewTokenSecret = process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET
    process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET ??=
      'pdv-test-preview-token-secret-0123456789'
    const stockConsumeFailure: { error?: AppError } = {}
    const stockRestoreFailure: { error?: AppError } = {}
    const databaseFailure: { error?: AppError } = {}
    const events: Event[] = []
    const eventsRepository: CapturedEventsRepository = {
      events,
      add: async (event) => {
        events.push(event)
      },
    }
    const setup: PdvRestSetup = {
      authProvider,
      configure,
      databaseFailure,
      eventsRepository,
      inngestClient,
      stockConsumeFailure,
      stockRestoreFailure,
    }
    const restFixture = await RestFixture.register(
      { imports: PDV_FIXTURE_IMPORTS },
      (builder) => PdvModuleFixture.configureRestFixture(builder, setup),
    )

    return {
      databaseFailure,
      originalPreviewTokenSecret,
      restFixture,
      stockConsumeFailure,
      stockRestoreFailure,
      eventsRepository,
    }
  }

  private static configureRestFixture(
    builder: TestingModuleBuilder,
    setup: PdvRestSetup,
  ): TestingModuleBuilder {
    const {
      authProvider,
      configure,
      databaseFailure,
      eventsRepository,
      inngestClient,
      stockConsumeFailure,
      stockRestoreFailure,
    } = setup
    let configuredBuilder = configure?.(builder) ?? builder

    if (inngestClient)
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest's TestingModuleBuilder exposes a useValue method.
      configuredBuilder = configuredBuilder
        .overrideProvider(InngestClient)
        .useValue(inngestClient)

    for (const token of IDENTITY_FIXTURE_AUTH_PROVIDERS) {
      configuredBuilder = configuredBuilder.overrideProvider(token).useValue(authProvider)
    }

    return configuredBuilder
      .overrideProvider(PDV_PROVIDERS.stockProvider)
      .useFactory(
        PdvModuleFixture.createStockProviderFactory(
          stockConsumeFailure,
          stockRestoreFailure,
        ),
      )
      .overrideProvider(PDV_REPOSITORIES.database)
      .useFactory(
        PdvModuleFixture.createDatabaseFactory(databaseFailure, eventsRepository),
      )
  }

  private static createStockProviderFactory(
    stockConsumeFailure: { error?: AppError },
    stockRestoreFailure: { error?: AppError },
  ) {
    return {
      inject: [MrpStockProvider],
      factory: (provider: MrpStockProvider) => ({
        consume: async (...args: Parameters<typeof provider.consume>) => {
          if (stockConsumeFailure.error) throw stockConsumeFailure.error
          return provider.consume(...args)
        },
        restore: async (...args: Parameters<typeof provider.restore>) => {
          const restorations = await provider.restore(...args)
          if (stockRestoreFailure.error) throw stockRestoreFailure.error
          return restorations
        },
      }),
    }
  }

  private static createDatabaseFactory(
    databaseFailure: { error?: AppError },
    eventsRepository: CapturedEventsRepository,
  ) {
    return {
      inject: [DrizzlePdvDatabase],
      factory: (database: DrizzlePdvDatabase): PdvDatabase => ({
        run<Result>(
          operation: (repositories: PdvDatabaseRepositories) => Promise<Result>,
        ) {
          return database.run(async (repositories) => {
            const result = await operation({ ...repositories, eventsRepository })
            if (databaseFailure.error) throw databaseFailure.error
            return result
          })
        },
      }),
    }
  }

  private static fromRestContext(
    context: Awaited<ReturnType<typeof PdvModuleFixture.registerRestContext>>,
    inngestFixture?: InngestFixture,
    originalEnvironment?: {
      readonly originalServerAppMode: string | undefined
      readonly originalEmailProvider: string | undefined
    },
  ) {
    return new PdvModuleFixture(
      context.restFixture,
      context.originalPreviewTokenSecret,
      context.stockConsumeFailure,
      context.stockRestoreFailure,
      context.databaseFailure,
      inngestFixture,
      context.eventsRepository,
      originalEnvironment?.originalServerAppMode,
      originalEnvironment?.originalEmailProvider,
    )
  }

  private static async registerWithInngest<T extends InngestJob>(
    authProvider: ServerAuthProvider,
    options: PdvModuleFixtureOptions<T>,
    jobType: InngestJobType<T>,
  ) {
    const originalServerAppMode = process.env.SCOOPS_SERVER_APP_MODE
    const originalEmailProvider = process.env.SCOOPS_EMAIL_PROVIDER
    process.env.SCOOPS_SERVER_APP_MODE = 'test'
    process.env.SCOOPS_EMAIL_PROVIDER = 'smtp'
    const registration: PdvJobRegistration = {}
    const inngestFixture = PdvModuleFixture.createInngestFixture(
      authProvider,
      options,
      jobType,
      registration,
    )
    const context = await PdvModuleFixture.startInngestFixture(
      inngestFixture,
      registration,
      originalServerAppMode,
      originalEmailProvider,
    )

    return PdvModuleFixture.fromRestContext(context, inngestFixture, {
      originalServerAppMode,
      originalEmailProvider,
    })
  }

  private static createInngestFixture<T extends InngestJob>(
    authProvider: ServerAuthProvider,
    options: PdvModuleFixtureOptions<T>,
    jobType: InngestJobType<T>,
    registration: PdvJobRegistration,
  ) {
    return new InngestFixture({
      functionId: jobType.ID,
      createJob: async (client) => {
        registration.context = await PdvModuleFixture.registerRestContext(
          authProvider,
          options.configure,
          client,
        )
        return registration.context.restFixture.get(jobType)
      },
    })
  }

  private static async startInngestFixture(
    inngestFixture: InngestFixture,
    registration: PdvJobRegistration,
    originalServerAppMode: string | undefined,
    originalEmailProvider: string | undefined,
  ): Promise<PdvRestContext> {
    try {
      await inngestFixture.setup()
    } catch (error) {
      return PdvModuleFixture.cleanupFailedInngestSetup(
        error,
        registration,
        originalServerAppMode,
        originalEmailProvider,
      )
    }

    if (!registration.context) {
      await inngestFixture.teardown()
      PdvModuleFixture.restoreJobEnvironment(originalServerAppMode, originalEmailProvider)
      throw new Error('O fixture do PDV não foi registrado no Inngest.')
    }

    return registration.context
  }

  private static async cleanupFailedInngestSetup(
    error: unknown,
    registration: PdvJobRegistration,
    originalServerAppMode: string | undefined,
    originalEmailProvider: string | undefined,
  ): Promise<never> {
    PdvModuleFixture.restoreJobEnvironment(originalServerAppMode, originalEmailProvider)
    const closeResult = await Promise.allSettled([
      Promise.resolve().then(() => registration.context?.restFixture.close()),
    ])
    const [result] = closeResult

    if (result?.status === 'rejected') {
      throw new AggregateError(
        [error, result.reason],
        'Failed to register the PDV fixture.',
      )
    }

    throw error
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

  get broker(): CapturedEventsRepository {
    return this.eventsRepository
  }

  get supportsImmutableCostSnapshots(): true {
    return true
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    if (!this.inngestFixture) {
      throw new Error('O fixture do PDV não foi registrado no Inngest.')
    }

    return this.inngestFixture.functionOptions
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture) {
      throw new Error('O fixture do PDV não foi registrado no Inngest.')
    }

    return this.inngestFixture.run(event)
  }

  invokeInngest(data?: Record<string, unknown>) {
    if (!this.inngestFixture) {
      throw new Error('O fixture do PDV não foi registrado no Inngest.')
    }

    return this.inngestFixture.invoke(data)
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

  setStockConsumeFailure(error?: AppError) {
    this.stockConsumeFailure.error = error
  }

  setStockRestoreFailure(error?: AppError) {
    this.stockRestoreFailure.error = error
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
    const {
      authorization,
      channelId,
      idempotencyKey,
      productName,
      quantity,
      stockQuantity,
    } = input
    const product = await this.addProduct({
      ...PORTION_PRODUCT_DEFAULTS,
      establishmentId: input.establishmentId ?? PdvModuleFixture.accounts.establishmentId,
      name: productName,
    })
    const size = await this.addProductSize({
      ...REGULAR_PRODUCT_SIZE_DEFAULTS,
      establishmentId: product.establishmentId,
      productId: product.id,
    })
    await this.stockBalances.initialize(product.id)
    await this.stockBalances.add({ productId: product.id }, stockQuantity ?? 100)

    const channel = channelId ? { channelId } : {}
    const lines = [
      {
        ...PORTION_ORDER_LINE_DEFAULTS,
        productId: product.id,
        quantity: quantity ?? 1,
        sizeId: size.id,
      },
    ]
    const preview = await request(this.app.getHttpServer())
      .post('/orders/preview')
      .set('Cookie', authorization)
      .send({ ...channel, lines })
    const order = await this.submitPortionOrder(
      authorization,
      idempotencyKey,
      preview.body.previewToken,
      channel,
      lines,
    )

    return { product, size, order }
  }

  /** Submit the same channel, cart and authorization that were used for the preview. */
  private async submitPortionOrder(
    authorization: string,
    idempotencyKey: string,
    previewToken: string,
    channel: { readonly channelId?: string },
    lines: PortionOrderLine[],
  ): Promise<Order> {
    const response = await request(this.app.getHttpServer())
      .post('/orders')
      .set('Cookie', authorization)
      .send({ idempotencyKey, previewToken, ...channel, lines })
    return response.body.order as Order
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
      if (this.inngestFixture) {
        PdvModuleFixture.restoreJobEnvironment(
          this.originalServerAppMode,
          this.originalEmailProvider,
        )
      }
      if (this.originalPreviewTokenSecret === undefined) {
        delete process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET
      } else {
        process.env.SCOOPS_PDV_PREVIEW_TOKEN_SECRET = this.originalPreviewTokenSecret
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to close the PDV fixture.')
    }
  }

  private static restoreJobEnvironment(
    originalServerAppMode: string | undefined,
    originalEmailProvider: string | undefined,
  ) {
    if (originalServerAppMode === undefined) delete process.env.SCOOPS_SERVER_APP_MODE
    else process.env.SCOOPS_SERVER_APP_MODE = originalServerAppMode
    if (originalEmailProvider === undefined) delete process.env.SCOOPS_EMAIL_PROVIDER
    else process.env.SCOOPS_EMAIL_PROVIDER = originalEmailProvider
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
  fixture.setStockConsumeFailure()
  fixture.setStockRestoreFailure()
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
