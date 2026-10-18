import { eq, sql } from 'drizzle-orm'
import request from 'supertest'
import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type {
  AccompanimentType,
  GlobalAccompaniment,
  Product,
  ProductAccompaniment,
  ProductCreate,
} from '@scoops/core/mrp/domain/entities'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { eventModel } from '@/shared/database/drizzle/models/event-model'

export function createProduct(overrides: Partial<ProductCreate> = {}): ProductCreate {
  return {
    establishmentId: MrpModuleFixture.accounts.establishmentId,
    name: 'Chocolate',
    unit: ProductUnit.Kilogram,
    categories: [ProductCategory.Ingredient],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    allowNegativeStock: false,
    ...overrides,
  }
}

export function expectedUpdatedAt(product: Pick<Product, 'updatedAt'>): string {
  return product.updatedAt.toISOString()
}

export async function prepareMrpFixture() {
  const auth = new BetterAuthFixture()
  const fixture = await MrpModuleFixture.register(auth)
  return { auth, fixture }
}

export async function resetMrpFixture(
  fixture: MrpModuleFixture,
  auth: BetterAuthFixture,
) {
  await auth.clear()
  await fixture.resetDatabase()
  await fixture.seedAccounts()
  fixture.authenticate(auth.setUser.bind(auth))
}

export function managerRequestAuthorization() {
  return `scoops.session_token=${MrpModuleFixture.accounts.managerToken}`
}

export function operatorRequestAuthorization() {
  return `scoops.session_token=${MrpModuleFixture.accounts.operatorToken}`
}

export function foreignManagerRequestAuthorization() {
  return `scoops.session_token=${MrpModuleFixture.accounts.foreignManagerToken}`
}

export async function findEvents(fixture: MrpModuleFixture, eventName: string) {
  return fixture
    .get(DrizzleClient)
    .requireDatabase()
    .select()
    .from(eventModel)
    .where(eq(eventModel.eventName, eventName))
}

export async function addGlobalAccompanimentWithRows(
  fixture: MrpModuleFixture,
  input: {
    target: Product
    type: AccompanimentType
    portions: readonly Product[]
    quantityPerPortion?: number
  },
): Promise<{ global: GlobalAccompaniment; rows: readonly ProductAccompaniment[] }> {
  const quantityPerPortion = input.quantityPerPortion ?? 1
  const global = await fixture.addGlobalAccompaniment({
    establishmentId: input.target.establishmentId,
    accompanimentProductId: input.target.id,
    accompanimentTypeId: input.type.id,
    quantityPerPortion,
  })
  const rows = await fixture.productAccompaniments.addMany(
    input.portions.map((portion) => ({
      establishmentId: portion.establishmentId,
      productId: portion.id,
      accompanimentProductId: input.target.id,
      accompanimentTypeId: input.type.id,
      quantityPerPortion,
      globalAccompanimentId: global.id,
    })),
  )
  return { global, rows }
}

export async function findSalesConfigurationProductIds(
  fixture: MrpModuleFixture,
): Promise<string[]> {
  const events = await findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME)
  return events.map((event) => (event.payload as { productId: string }).productId).sort()
}

/**
 * Makes the database reject the second sales-configuration event written in one
 * transaction, so a use case fails after it already wrote its rows and the first event.
 * Returns the cleanup that removes the trigger.
 */
export async function failSecondSalesConfigurationEvent(
  fixture: MrpModuleFixture,
): Promise<() => Promise<void>> {
  const database = fixture.get(DrizzleClient).requireDatabase()
  await database.execute(
    sql.raw(`
    CREATE OR REPLACE FUNCTION test_fail_second_sales_configuration_event()
    RETURNS trigger AS $$
    BEGIN
      IF (SELECT count(*) FROM events WHERE event_name = NEW.event_name) >= 1 THEN
        RAISE EXCEPTION 'forced mid-transaction failure';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `),
  )
  await database.execute(
    sql.raw(`
    CREATE TRIGGER test_fail_second_sales_configuration_event
    BEFORE INSERT ON events
    FOR EACH ROW
    WHEN (NEW.event_name = '${ProductSalesConfigurationChangedEvent._NAME}')
    EXECUTE FUNCTION test_fail_second_sales_configuration_event()
  `),
  )
  return async () => {
    await database.execute(
      sql.raw(
        'DROP TRIGGER IF EXISTS test_fail_second_sales_configuration_event ON events',
      ),
    )
    await database.execute(
      sql.raw('DROP FUNCTION IF EXISTS test_fail_second_sales_configuration_event()'),
    )
  }
}

export async function registerPortionThroughRest(
  fixture: MrpModuleFixture,
  name: string,
): Promise<Product> {
  const response = await request(fixture.app.getHttpServer())
    .post('/products')
    .set('Cookie', managerRequestAuthorization())
    .send({
      name,
      unit: ProductUnit.Kilogram,
      categories: [ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      allowNegativeStock: false,
      idealStock: 0,
    })
  if (response.status !== 201) {
    throw new Error(`Portion registration failed with status ${response.status}.`)
  }
  const product = await fixture.products.findByName(
    MrpModuleFixture.accounts.establishmentId,
    name,
  )
  if (!product) throw new Error('The registered Portion was not persisted.')
  return product
}
