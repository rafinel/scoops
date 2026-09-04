import type { ProductCreate } from '@scoops/core/mrp/domain/structures'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'
import type { ComboCreate } from '@scoops/core/pdv/domain/structures'

import { PdvModuleFixture } from '@/pdv/fixtures/pdv-module-fixture'

const firstProductId = '51000000-0000-4000-8000-000000000001'
const secondProductId = '51000000-0000-4000-8000-000000000002'
export const SCOOPS_SESSION_COOKIE_NAME = 'scoops.session_token'

export function comboCreate(overrides: Partial<ComboCreate> = {}): ComboCreate {
  return {
    establishmentId: PdvModuleFixture.accounts.establishmentId,
    name: 'Chocolate Combo',
    status: 'inactive',
    fixedPrice: 15,
    components: [
      {
        kind: 'resale',
        productId: firstProductId,
        quantity: 1,
      },
      {
        kind: 'resale',
        productId: secondProductId,
        quantity: 1,
      },
    ],
    ...overrides,
  }
}

export function productCreate(overrides: Partial<ProductCreate> = {}): ProductCreate {
  return {
    establishmentId: PdvModuleFixture.accounts.establishmentId,
    name: 'Chocolate',
    unit: ProductUnit.Unit,
    categories: [ProductCategory.Resale],
    stockControl: ProductStockControl.Single,
    status: ProductStatus.Active,
    allowNegativeStock: false,
    ...overrides,
  }
}

export function expectedUpdatedAt(value: { updatedAt: Date }) {
  return value.updatedAt.toISOString()
}
