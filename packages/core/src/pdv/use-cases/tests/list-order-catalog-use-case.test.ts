import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ServiceUnavailableError,
} from '#shared/domain/errors/index.ts'
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

  it('defaults pagination and treats a whitespace-only search as absent', async () => {
    await useCase.execute({
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Manager },
      search: '   ',
    })

    expect(catalog.findMany).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      search: undefined,
      kind: undefined,
      page: 1,
      pageSize: 20,
    })
  })

  it('accepts the minimum and maximum page sizes', async () => {
    await useCase.execute({
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
      pageSize: 1,
    })
    await useCase.execute({
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
      pageSize: 50,
    })

    expect(catalog.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ pageSize: 1 }),
    )
    expect(catalog.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pageSize: 50 }),
    )
  })

  it.each([
    ['zero page', { page: 0 }],
    ['fractional page', { page: 1.5 }],
    ['zero page size', { pageSize: 0 }],
    ['fractional page size', { pageSize: 1.5 }],
    ['page size above the limit', { pageSize: 51 }],
    ['invalid item kind', { kind: 'combo' as never }],
    ['too long search', { search: 'x'.repeat(121) }],
  ])('rejects %s before consulting the provider', async (_label, input) => {
    await expect(
      useCase.execute({
        actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
        ...input,
      }),
    ).rejects.toThrow(BadRequestError)

    expect(catalog.findMany).not.toHaveBeenCalled()
  })

  it('wraps unexpected provider failures as service unavailable', async () => {
    catalog.findMany.mockRejectedValue(new Error('network failure'))

    await expect(
      useCase.execute({
        actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
      }),
    ).rejects.toThrow(
      new ServiceUnavailableError('Não foi possível consultar o catálogo de produtos.'),
    )
  })
})
