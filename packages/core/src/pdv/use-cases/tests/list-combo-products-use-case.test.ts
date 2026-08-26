import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { ListComboProductsUseCase } from '#pdv/use-cases/list-combo-products-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const _expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('ListComboProductsUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let catalog: MockProxy<SalesCatalogProvider>
  let _broker: MockProxy<Broker>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    catalog = mock<SalesCatalogProvider>()
    _broker = mock<Broker>()
  })
  it('rejects non-manager actors before infrastructure access', async () => {
    const useCase = new ListComboProductsUseCase(catalog)
    await expect(
      useCase.execute({ actor, page: 1, pageSize: 10 }),
    ).rejects.toBeInstanceOf(Error)
    expect(database.run).not.toHaveBeenCalled()
  })
})
