import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import { RevalidateCombosForProductUseCase } from '#pdv/use-cases/revalidate-combos-for-product-use-case.ts'

describe('RevalidateCombosForProductUseCase', () => {
  it('is repeat-safe when no dependent combos exist', async () => {
    const database = mock<PdvDatabase>()
    database.run.mockResolvedValue([])
    await expect(
      new RevalidateCombosForProductUseCase(database).execute({
        establishmentId: 'e1',
        productId: 'p1',
        state: 'deleted',
        configuration: null,
      }),
    ).resolves.toEqual([])
  })
})
