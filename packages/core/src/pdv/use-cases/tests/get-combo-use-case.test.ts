import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import { NotFoundError } from '#shared/domain/errors/index.ts'
import { GetComboUseCase } from '#pdv/use-cases/get-combo-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const _expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('GetComboUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let catalog: MockProxy<SalesCatalogProvider>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    catalog = mock<SalesCatalogProvider>()
    database.run.mockImplementation(async (operation) =>
      operation({
        discountsRepository: { findById: async () => undefined },
      } as never),
    )
  })
  it('allows Operators to read discounts within their establishment', async () => {
    const useCase = new GetComboUseCase(database, catalog)
    await expect(useCase.execute({ actor, comboId: 'combo-1' })).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(database.run).toHaveBeenCalledOnce()
  })
})
