import type { INestApplication, Type } from '@nestjs/common'
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
  Production,
  ProductionIngredient,
  Recipe,
  RecipeIngredient,
  ResaleConfiguration,
} from '@scoops/core/mrp/domain/entities'
import type {
  AccompanimentTypeCreate,
  ProductAccompanimentCreate,
  ProductCreate,
  ProductSizeCreate,
  RecipeCreate,
  RecipeIngredientCreate,
  ResaleConfigurationCreate,
} from '@scoops/core/mrp/domain/structures'
import type {
  AccompanimentTypesRepository,
  BrandsRepository,
  ProductAccompanimentsRepository,
  ProductsRepository,
  ProductSizesRepository,
  ProductionIngredientsRepository,
  ProductionsRepository,
  RecipeIngredientsRepository,
  RecipesRepository,
  ResaleConfigurationsRepository,
  StockBalancesRepository,
  StockTransactionsRepository,
} from '@scoops/core/mrp/interfaces'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IdentityModule } from '@/identity/identity.module'
import { MRP_REPOSITORIES } from '@/mrp/constants'
import { MrpSeeder } from '@/mrp/database/mrp-seeder'
import { MRP_STOCK_TRANSACTIONS_REPOSITORY } from '@/mrp/database/mrp-repositories'
import { MrpModule } from '@/mrp/mrp.module'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'
import { InngestMock } from '@/shared/messaging/inngest/inngest-mock'
import { SharedModule } from '@/shared/shared.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class MrpModuleFixture {
  static readonly accounts = {
    establishmentId: '41000000-0000-0000-0000-000000000001',
    managerId: '41000000-0000-0000-0000-000000000002',
    managerToken: 'mrp-manager-token',
    operatorId: '41000000-0000-0000-0000-000000000003',
    operatorToken: 'mrp-operator-token',
    foreignEstablishmentId: '42000000-0000-0000-0000-000000000001',
    foreignManagerId: '42000000-0000-0000-0000-000000000002',
    foreignManagerToken: 'mrp-foreign-manager-token',
  } as const

  private constructor(private readonly restFixture: RestFixture) {}

  static async register(authProvider: ServerAuthProvider) {
    const restFixture = await RestFixture.register(
      {
        imports: [
          SharedModule,
          IdentityModule,
          MrpModule,
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
    return new MrpModuleFixture(restFixture)
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  get<T>(typeOrToken: Type<T> | string | symbol) {
    return this.restFixture.get<T>(typeOrToken)
  }

  get products(): ProductsRepository {
    return this.get(MRP_REPOSITORIES.products)
  }

  get accompanimentTypes(): AccompanimentTypesRepository {
    return this.get(MRP_REPOSITORIES.accompanimentTypes)
  }

  get productAccompaniments(): ProductAccompanimentsRepository {
    return this.get(MRP_REPOSITORIES.productAccompaniments)
  }

  get brands(): BrandsRepository {
    return this.get(MRP_REPOSITORIES.brands)
  }

  get balances(): StockBalancesRepository {
    return this.get(MRP_REPOSITORIES.stockBalances)
  }

  get productSizes(): ProductSizesRepository {
    return this.get(MRP_REPOSITORIES.productSizes)
  }

  get resaleConfigurations(): ResaleConfigurationsRepository {
    return this.get(MRP_REPOSITORIES.resaleConfigurations)
  }

  get transactions(): StockTransactionsRepository {
    return this.get(MRP_STOCK_TRANSACTIONS_REPOSITORY)
  }

  get recipes(): RecipesRepository {
    return this.get(MRP_REPOSITORIES.recipes)
  }

  get recipeIngredients(): RecipeIngredientsRepository {
    return this.get(MRP_REPOSITORIES.recipeIngredients)
  }

  get productions(): ProductionsRepository {
    return this.get(MRP_REPOSITORIES.productions)
  }

  get productionIngredients(): ProductionIngredientsRepository {
    return this.get(MRP_REPOSITORIES.productionIngredients)
  }

  async resetDatabase() {
    await this.restFixture.resetDatabase()
  }

  async seedAccounts() {
    const ids = MrpModuleFixture.accounts
    const users: User[] = [
      UserFaker.fake({
        id: ids.managerId,
        establishmentId: ids.establishmentId,
        name: 'Maria Manager',
        email: 'mrp.manager@example.com',
        profile: UserProfile.Manager,
      }),
      UserFaker.fake({
        id: ids.operatorId,
        establishmentId: ids.establishmentId,
        name: 'Otavio Operator',
        email: 'mrp.operator@example.com',
        profile: UserProfile.Operator,
      }),
      UserFaker.fake({
        id: ids.foreignManagerId,
        establishmentId: ids.foreignEstablishmentId,
        name: 'Foreign Manager',
        email: 'mrp.foreign@example.com',
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
    await this.get<MrpSeeder>(MrpSeeder).run()
    return users
  }

  authenticate(setUser: (token: string, user: { id: string; email: string }) => void) {
    const ids = MrpModuleFixture.accounts
    setUser(ids.managerToken, { id: ids.managerId, email: 'mrp.manager@example.com' })
    setUser(ids.operatorToken, { id: ids.operatorId, email: 'mrp.operator@example.com' })
    setUser(ids.foreignManagerToken, {
      id: ids.foreignManagerId,
      email: 'mrp.foreign@example.com',
    })
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

  addRecipe(input: RecipeCreate): Promise<Recipe> {
    return this.recipes.add(input)
  }

  addRecipeIngredient(input: RecipeIngredientCreate): Promise<RecipeIngredient> {
    return this.recipeIngredients.add(input)
  }

  addProduction(input: Omit<Production, 'id'>): Promise<Production> {
    return this.productions.add(input)
  }

  addProductionIngredients(
    input: readonly Omit<ProductionIngredient, 'id'>[],
  ): Promise<readonly ProductionIngredient[]> {
    return this.productionIngredients.addMany(input)
  }

  close() {
    return this.restFixture.close()
  }
}
