import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { RegisterComboUseCase } from '#pdv/use-cases/register-combo-use-case.ts'

const actor = { establishmentId: 'e1', profile: UserProfile.Operator }
const _expectedUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
describe('RegisterComboUseCase', () => {
  let database: MockProxy<PdvDatabase>
  let catalog: MockProxy<SalesCatalogProvider>
  let broker: MockProxy<Broker>
  beforeEach(() => {
    database = mock<PdvDatabase>()
    catalog = mock<SalesCatalogProvider>()
    broker = mock<Broker>()
  })
  it('rejects non-manager actors before infrastructure access', async () => {
    const useCase = new RegisterComboUseCase(database, catalog, broker)
    await expect(
      useCase.execute({
        actor,
        name: 'Combo',
        status: 'active',
        fixedPrice: 1,
        components: [
          { kind: 'resale', productId: 'p1', quantity: 1 },
          { kind: 'resale', productId: 'p2', quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(Error)
    expect(database.run).not.toHaveBeenCalled()
  })
})
