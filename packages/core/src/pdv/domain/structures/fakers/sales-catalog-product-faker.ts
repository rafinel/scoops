import { faker } from '@faker-js/faker'

import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { SaleItemKind } from '#pdv/domain/structures/sale-item-kind.ts'
import { SalesCatalogAvailability } from '#pdv/domain/structures/sales-catalog-availability.ts'
import type { SalesCatalogListItem } from '#pdv/domain/structures/sales-catalog-list-item.ts'
import type { SalesCatalogProduct } from '#pdv/domain/structures/sales-catalog-product.ts'

export class SalesCatalogProductFaker {
  static fake(overrides: Partial<SalesCatalogProduct> = {}): SalesCatalogProduct {
    return {
      productId: faker.string.uuid(),
      name: faker.commerce.productName(),
      kind: SaleItemKind.Resale,
      stockControl: ProductStockControl.Single,
      isActive: true,
      isAvailable: true,
      sizes: [],
      resaleBrands: [],
      resalePrice: 10,
      ...overrides,
    }
  }

  static fakeListItem(
    overrides: Partial<SalesCatalogListItem> = {},
  ): SalesCatalogListItem {
    return {
      ...SalesCatalogProductFaker.fake(),
      availability: SalesCatalogAvailability.Available,
      ...overrides,
    }
  }

  static fakeMany(count = 10): SalesCatalogProduct[] {
    return Array.from({ length: count }, () => SalesCatalogProductFaker.fake())
  }
}
