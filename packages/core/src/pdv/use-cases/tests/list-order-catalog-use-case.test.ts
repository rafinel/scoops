import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import { AuthorizationError } from '#shared/domain/errors/index.ts'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import { ListOrderCatalogUseCase } from '#pdv/use-cases/list-order-catalog-use-case.ts'

describe('List Order Catalog Use Case', () => {
  let catalog: MockProxy<SalesCatalogProvider>
  let useCase: ListOrderCatalogUseCase

  beforeEach(() => {
    catalog = mock<SalesCatalogProvider>()
    catalog.findMany.mockResolvedValue(new PaginationResponse([], 1, 20, 0, 0))
    useCase = new ListOrderCatalogUseCase(catalog)
  })

  it('allows Managers and Operators and delegates the tenant query untouched', async () => {
    const result = new PaginationResponse([], 1, 10, 0, 0)
    catalog.findMany.mockResolvedValue(result)

    await expect(
      useCase.execute({
        actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
        search: '  gelato  ',
        kind: 'portion',
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toBe(result)

    expect(catalog.findMany).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      search: 'gelato',
      kind: 'portion',
      page: 2,
      pageSize: 10,
    })
  })

  it('rejects unauthorized profiles before consulting the provider', async () => {
    await expect(
      useCase.execute({
        actor: { establishmentId: 'establishment-1', profile: 'guest' as UserProfile },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(catalog.findMany).not.toHaveBeenCalled()
  })
})
