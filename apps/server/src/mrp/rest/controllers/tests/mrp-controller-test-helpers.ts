import type { Product, ProductCreate } from '@scoops/core/mrp/domain/entities'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

import { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
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
  const auth = new SupabaseAuthFixture()
  const fixture = await MrpModuleFixture.register(auth)
  return { auth, fixture }
}

export async function resetMrpFixture(
  fixture: MrpModuleFixture,
  auth: SupabaseAuthFixture,
) {
  await auth.clear()
  await fixture.resetDatabase()
  await fixture.seedAccounts()
  fixture.authenticate(auth.setUser.bind(auth))
}

export function managerRequestAuthorization() {
  return `Bearer ${MrpModuleFixture.accounts.managerToken}`
}

export function operatorRequestAuthorization() {
  return `Bearer ${MrpModuleFixture.accounts.operatorToken}`
}

export function foreignManagerRequestAuthorization() {
  return `Bearer ${MrpModuleFixture.accounts.foreignManagerToken}`
}
