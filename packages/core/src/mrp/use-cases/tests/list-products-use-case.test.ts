import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import {
  ProductSortDirection,
  ProductSortField,
} from '#mrp/domain/structures/product-list-params.ts'
import { ProductStockSituation } from '#mrp/domain/structures/product-stock-situation.ts'
import { ListProductsUseCase } from '#mrp/use-cases/list-products-use-case.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'

describe('List Products Use Case', () => {
  let productsRepository: MockProxy<ProductsRepository>
  let useCase: ListProductsUseCase

  beforeEach(() => {
    productsRepository = mock<ProductsRepository>()
    useCase = new ListProductsUseCase(productsRepository)
  })

  it('normalizes the actor scope, filters, page, and sort before querying', async () => {
    productsRepository.findMany.mockResolvedValue({} as never)

    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      search: '  milk  ',
      categories: [ProductCategory.Ingredient, ProductCategory.Ingredient],
      stockSituation: ProductStockSituation.Low,
      sortBy: ProductSortField.StockQuantity,
      sortDirection: ProductSortDirection.Descending,
      page: 2,
      pageSize: 25,
    })

    expect(productsRepository.findMany).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      search: 'milk',
      categories: [ProductCategory.Ingredient],
      stockSituation: ProductStockSituation.Low,
      sortBy: ProductSortField.StockQuantity,
      sortDirection: ProductSortDirection.Descending,
      page: 2,
      pageSize: 25,
    })
  })

  it('rejects non-manager actors and invalid page sizes', async () => {
    const operatorRequest = {
      actor: {
        id: 'operator-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Operator,
      },
    }

    await expect(useCase.execute(operatorRequest)).rejects.toBeInstanceOf(
      AuthorizationError,
    )
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        pageSize: 101,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })

  it('defaults to newest products first', async () => {
    productsRepository.findMany.mockResolvedValue({} as never)

    await useCase.execute({
      actor: {
        id: 'manager-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
    })

    expect(productsRepository.findMany).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      page: 1,
      pageSize: 10,
      sortBy: ProductSortField.CreatedAt,
      sortDirection: ProductSortDirection.Descending,
    })
  })
})
