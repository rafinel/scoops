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

export async function addPortionWithGlobalAccompaniment(fixture: PdvModuleFixture) {
  const establishmentId = PdvModuleFixture.accounts.establishmentId
  const portion = await fixture.addProduct(
    productCreate({
      name: 'Combo Portion',
      categories: [ProductCategory.Portion],
      currentUnitCost: 2,
    }),
  )
  const size = await fixture.addProductSize({
    establishmentId,
    productId: portion.id,
    name: 'Regular',
    quantity: 1,
    price: 10,
    isActive: true,
  })
  const target = await fixture.addProduct(
    productCreate({
      name: 'Combo Global Topping',
      categories: [ProductCategory.Accompaniment],
      currentUnitCost: 0.5,
      accompanimentPrice: 3.5,
    }),
  )
  const type = await fixture.addAccompanimentType({
    establishmentId,
    name: 'Combo Toppings',
  })
  const global = await fixture.addGlobalAccompaniment({
    establishmentId,
    accompanimentProductId: target.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 0.5,
    accompanimentPrice: 3.5,
  })
  const row = await fixture.addProductAccompaniment({
    establishmentId,
    productId: portion.id,
    accompanimentProductId: target.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 0.5,
    globalAccompanimentId: global.id,
  })
  const resale = await fixture.addProduct(
    productCreate({ name: 'Combo Resale', categories: [ProductCategory.Resale] }),
  )
  await fixture.addResaleConfiguration({
    establishmentId,
    productId: resale.id,
    price: 5,
    isActive: true,
  })
  const components = [
    {
      kind: 'portion' as const,
      productId: portion.id,
      quantity: 1,
      sizeId: size.id,
      accompanimentIds: [row.id],
    },
    { kind: 'resale' as const, productId: resale.id, quantity: 1 },
  ]
  return { portion, size, target, type, global, row, resale, components }
}
