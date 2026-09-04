import type { Product, ProductCreate } from '@scoops/core/mrp/domain/entities'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

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
