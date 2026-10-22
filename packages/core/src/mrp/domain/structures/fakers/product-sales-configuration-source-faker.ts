import type { ProductSalesConfigurationSource } from '#mrp/domain/structures/product-sales-configuration-source.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/product-faker.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'

export class ProductSalesConfigurationSourceFaker {
  static fake(
    overrides: Partial<ProductSalesConfigurationSource> = {},
  ): ProductSalesConfigurationSource {
    return {
      product: ProductFaker.fake({ categories: [ProductCategory.Portion] }),
      sizes: [],
      links: [],
      resaleConfigurations: [],
      brands: [],
      accompanimentProducts: [],
      accompanimentTypes: [],
      globals: [],
      ...overrides,
    }
  }

  static fakeMany(count = 10): ProductSalesConfigurationSource[] {
    return Array.from({ length: count }, () =>
      ProductSalesConfigurationSourceFaker.fake(),
    )
  }
}
