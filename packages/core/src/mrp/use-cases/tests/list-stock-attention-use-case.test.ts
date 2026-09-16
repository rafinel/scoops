import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'

import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { ListStockAttentionUseCase } from '#mrp/use-cases/list-stock-attention-use-case.ts'

describe('ListStockAttentionUseCase', () => {
  it('classifies, orders and caps the current tenant facts', async () => {
    const database = mock<MrpDatabase>()
    const repository = mock<MrpDatabaseRepositories['stockAttentionFactsRepository']>()
    if (!repository) throw new Error('test repository unavailable')
    database.readSnapshot.mockImplementation(async (operation) =>
      operation({ stockAttentionFactsRepository: repository }),
    )
    repository.listBatch.mockResolvedValue({
      items: [
        {
          establishmentId: 'shop-1',
          productId: 'limited',
          productName: 'Bolo',
          categories: [ProductCategory.Manufacturable],
          availableQuantity: 2,
          idealQuantity: 10,
          recipe: {
            yieldQuantity: 1,
            ingredients: [{ requiredQuantity: 1, availableQuantity: 0 }],
          },
        },
        {
          establishmentId: 'shop-1',
          productId: 'zero',
          productName: 'Leite',
          categories: [ProductCategory.Ingredient],
          availableQuantity: 0,
          idealQuantity: 2,
          recipe: null,
        },
        {
          establishmentId: 'shop-1',
          productId: 'normal',
          productName: 'Baunilha',
          categories: [ProductCategory.Ingredient],
          availableQuantity: 4,
          idealQuantity: 2,
          recipe: null,
        },
      ],
      nextCursor: undefined,
    })

    await expect(
      new ListStockAttentionUseCase(database).execute({ establishmentId: 'shop-1' }),
    ).resolves.toEqual([
      expect.objectContaining({ productId: 'zero', kind: 'zero-stock' }),
      expect.objectContaining({ productId: 'limited', kind: 'below-ideal' }),
    ])
  })
})
