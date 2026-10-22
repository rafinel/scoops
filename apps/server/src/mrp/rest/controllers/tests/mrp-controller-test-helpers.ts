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
  type ProductSalesConfiguration,
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
    /** The global's shared price; defaults to the target's default price, pass `undefined` for none. */
    accompanimentPrice?: number
  },
): Promise<{ global: GlobalAccompaniment; rows: readonly ProductAccompaniment[] }> {
  const quantityPerPortion = input.quantityPerPortion ?? 1
  const global = await fixture.addGlobalAccompaniment({
    establishmentId: input.target.establishmentId,
    accompanimentProductId: input.target.id,
    accompanimentTypeId: input.type.id,
    quantityPerPortion,
    accompanimentPrice:
      'accompanimentPrice' in input
        ? input.accompanimentPrice
        : input.target.accompanimentPrice,
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

type StoredSalesConfiguration = Omit<ProductSalesConfiguration, 'updatedAt'> & {
  readonly updatedAt: string
}

export type SalesConfigurationPayload = {
  readonly establishmentId: string
  readonly productId: string
  readonly state: 'available' | 'deleted'
  readonly configuration: StoredSalesConfiguration | null
}

/**
 * Reads the complete stored payload of every sales-configuration event. The events table
 * has no sequence column, so the payloads are returned sorted by product id and state
 * (`available` before `deleted`); publication order is asserted by Core use-case tests.
 * `configuration.updatedAt` is the ISO string persisted in the outbox.
 */
export async function findSalesConfigurationPayloads(
  fixture: MrpModuleFixture,
): Promise<SalesConfigurationPayload[]> {
  const events = await findEvents(fixture, ProductSalesConfigurationChangedEvent._NAME)
  return events
    .map((event) => event.payload as SalesConfigurationPayload)
    .sort(
      (left, right) =>
        left.productId.localeCompare(right.productId) ||
        left.state.localeCompare(right.state),
    )
}

/** Orders rows like the database does for the repositories under test (`ORDER BY id`). */
export function sortById<Row extends { readonly id: string }>(
  rows: readonly Row[],
): Row[] {
  return [...rows].sort((left, right) => (left.id < right.id ? -1 : 1))
}

/** The ISO string of the latest instant, as stored in a payload `updatedAt`. */
export function latestIso(...dates: readonly Date[]): string {
  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString()
}

/**
 * Moves a row's `updated_at` to a fixed instant, bypassing repositories, so a test can make
 * one specific fact the latest one of a sales configuration.
 */
export async function setUpdatedAt(
  fixture: MrpModuleFixture,
  table:
    | 'accompaniment_types'
    | 'product_accompaniments'
    | 'product_brands'
    | 'product_sizes'
    | 'products'
    | 'resale_configurations',
  id: string,
  updatedAt: Date,
): Promise<void> {
  await fixture
    .get(DrizzleClient)
    .requireDatabase()
    .execute(
      sql.raw(
        `UPDATE ${table} SET updated_at = '${updatedAt.toISOString()}' WHERE id = '${id}'`,
      ),
    )
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

/**
 * Makes the database reject inserts into the given table once `allowedRows` rows exist
 * (default 0: every insert), so a registration fails after earlier writes of the same
 * transaction already happened. Returns the cleanup that removes the trigger.
 */
export async function failInsertInto(
  fixture: MrpModuleFixture,
  table: 'product_sizes' | 'resale_configurations' | 'stock_transactions',
  allowedRows = 0,
): Promise<() => Promise<void>> {
  const database = fixture.get(DrizzleClient).requireDatabase()
  const name = `test_fail_insert_into_${table}`
  await database.execute(
    sql.raw(`
    CREATE OR REPLACE FUNCTION ${name}()
    RETURNS trigger AS $$
    BEGIN
      IF (SELECT count(*) FROM ${table}) >= ${allowedRows} THEN
        RAISE EXCEPTION 'forced insert failure';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `),
  )
  await database.execute(
    sql.raw(`
    CREATE TRIGGER ${name}
    BEFORE INSERT ON ${table}
    FOR EACH ROW
    EXECUTE FUNCTION ${name}()
  `),
  )
  return async () => {
    await database.execute(sql.raw(`DROP TRIGGER IF EXISTS ${name} ON ${table}`))
    await database.execute(sql.raw(`DROP FUNCTION IF EXISTS ${name}()`))
  }
}

/** Counts every row of a table, bypassing repositories (for rollback assertions). */
export async function countRows(
  fixture: MrpModuleFixture,
  table:
    | 'product_accompaniments'
    | 'product_sizes'
    | 'products'
    | 'resale_configurations'
    | 'stock_balances'
    | 'stock_transactions',
): Promise<number> {
  const result = await fixture
    .get(DrizzleClient)
    .requireDatabase()
    .execute(sql.raw(`SELECT count(*)::int AS count FROM ${table}`))
  const rows = (Array.isArray(result) ? result : result.rows) as Array<{ count: number }>
  return rows[0]?.count ?? -1
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
