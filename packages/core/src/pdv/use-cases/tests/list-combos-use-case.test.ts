import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const _expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('ListCombosUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let catalog: MockProxy<SalesCatalogProvider>
  let findPage: ReturnType<typeof vi.fn>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    catalog = mock<SalesCatalogProvider>()
    findPage = vi.fn(async () => ({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }))
    database.run.mockImplementation(async (operation) =>
      operation({
        discountsRepository: {
          findPage,
        },
      } as never),
    )
  })
  it('allows Operators to list discounts scoped to their establishment', async () => {
    const useCase = new ListCombosUseCase(database, catalog)
    await expect(
      useCase.execute({ actor, page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({
      items: [],
      page: 1,
      total: 0,
    })
    expect(database.run).toHaveBeenCalledOnce()
    expect(findPage).toHaveBeenCalledWith(
      {
        establishmentId: 'e1',
        search: undefined,
        type: undefined,
        status: undefined,
        page: 1,
        pageSize: 10,
      },
      undefined,
    )
  })

  it('uses default pagination when it is omitted', async () => {
    await new ListCombosUseCase(database, catalog).execute({ actor })

    expect(findPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20 }),
      undefined,
    )
  })

  it('accepts the minimum and maximum page sizes', async () => {
    const useCase = new ListCombosUseCase(database, catalog)

    await useCase.execute({ actor, pageSize: 1 })
    await useCase.execute({ actor, pageSize: 50 })

    expect(findPage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ pageSize: 1 }),
      undefined,
    )
    expect(findPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pageSize: 50 }),
      undefined,
    )
  })

  it('trims a search before looking up products and querying combos', async () => {
    catalog.findProductIdsByName.mockResolvedValue(['product-1'])

    await new ListCombosUseCase(database, catalog).execute({
      actor,
      search: '  pizza  ',
    })

    expect(catalog.findProductIdsByName).toHaveBeenCalledWith('e1', 'pizza')
    expect(findPage).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'pizza', page: 1, pageSize: 20 }),
      ['product-1'],
    )
  })

  it.each([
    ['zero page', { page: 0 }],
    ['fractional page', { page: 1.5 }],
    ['zero page size', { pageSize: 0 }],
    ['fractional page size', { pageSize: 1.5 }],
    ['page size above the limit', { pageSize: 51 }],
  ])('rejects %s before querying', async (_label, pagination) => {
    await expect(
      new ListCombosUseCase(database, catalog).execute({ actor, ...pagination }),
    ).rejects.toThrow(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects actors who cannot manage combos before querying', async () => {
    await expect(
      new ListCombosUseCase(database, catalog).execute({
        actor: { ...actor, profile: 'guest' as UserProfile },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['too long search', { search: 'x'.repeat(121) }],
    ['invalid discount type', { type: 'invalid' as DiscountType }],
    ['invalid discount status', { status: 'invalid' as DiscountStatus }],
  ])('rejects %s before querying', async (_label, filters) => {
    await expect(
      new ListCombosUseCase(database, catalog).execute({ actor, ...filters }),
    ).rejects.toThrow(
      filters.search
        ? 'A busca deve ter no máximo 120 caracteres.'
        : filters.type
          ? 'O tipo de desconto é inválido.'
          : 'O status do combo é inválido.',
    )

    expect(database.run).not.toHaveBeenCalled()
    expect(catalog.findProductIdsByName).not.toHaveBeenCalled()
  })
})
