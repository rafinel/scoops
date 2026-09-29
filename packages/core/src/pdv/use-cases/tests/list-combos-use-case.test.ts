import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const _expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('ListCombosUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let catalog: MockProxy<SalesCatalogProvider>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    catalog = mock<SalesCatalogProvider>()
    database.run.mockImplementation(async (operation) =>
      operation({
        discountsRepository: {
          findPage: async () => ({
            items: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          }),
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
  })
})
