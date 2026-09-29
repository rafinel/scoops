import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'
import type { GlobalSearchProviderInput } from '@scoops/core/identity/domain/structures'
import type { MrpGlobalSearchProvider } from '@scoops/core/identity/interfaces'
import {
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import type { ProductsRepository } from '@scoops/core/mrp/interfaces'
import { Inject, Injectable } from '@nestjs/common'

import { MRP_REPOSITORIES } from '@/mrp/constants'

const PRODUCT_SEARCH_OPTIONS = {
  page: 1,
  sortBy: ProductSortField.Name,
  sortDirection: ProductSortDirection.Ascending,
} as const

@Injectable()
export class MrpGlobalSearchProviderAdapter implements MrpGlobalSearchProvider {
  constructor(
    @Inject(MRP_REPOSITORIES.products)
    private readonly productsRepository: ProductsRepository,
  ) {}

  searchProducts(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]> {
    return this.productsRepository
      .findMany(toProductSearchParams(input))
      .then(({ items }) => items.map(toProductHit))
  }
}

function toProductSearchParams(
  input: GlobalSearchProviderInput,
): Parameters<ProductsRepository['findMany']>[0] {
  return {
    ...PRODUCT_SEARCH_OPTIONS,
    establishmentId: input.establishmentId,
    search: input.query,
    pageSize: input.limit,
  }
}

function toProductHit(
  item: Awaited<ReturnType<ProductsRepository['findMany']>>['items'][number],
): GlobalSearchHit {
  const { product } = item
  return {
    kind: 'product',
    productId: product.id,
    label: product.name,
    status: product.status,
  }
}
