import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { RemoveComboUseCase } from '#pdv/use-cases/remove-combo-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('RemoveComboUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let _catalog: MockProxy<SalesCatalogProvider>
  let broker: MockProxy<Broker>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    _catalog = mock<SalesCatalogProvider>()
    broker = mock<Broker>()
  })
  it('rejects non-manager actors before infrastructure access', async () => {
    const useCase = new RemoveComboUseCase(database, broker)
    await expect(
      useCase.execute({ actor, comboId: 'combo-1', expectedUpdatedAt }),
    ).rejects.toBeInstanceOf(Error)
    expect(database.run).not.toHaveBeenCalled()
  })
})
