import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { Brand } from '@scoops/core/mrp/domain/entities'
import type {
  BrandsRepository,
  ProductsRepository,
  StockBalancesRepository,
  StockTransactionsRepository,
} from '@scoops/core/mrp/interfaces'
import type { StockRestorationRequest } from '@scoops/core/pdv/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { TransactionBoundStockRestorer } from '@/mrp/provision/pdv/transaction-bound-order-registration-dependencies-factory'
import { DrizzlePdvDatabase } from '@/pdv/database/drizzle/repositories/drizzle-pdv-database'

const establishmentId = '43000000-0000-0000-0000-000000000001'
const orderId = '43000000-0000-0000-0000-000000000010'
const actorId = '43000000-0000-0000-0000-000000000002'
const occurredAt = new Date('2026-08-28T12:34:56.000Z')

describe('TransactionBoundStockRestorer', () => {
  it('restores surviving product and brand targets with immutable labels and shared facts', async () => {
    const product = ProductFaker.fake({
      id: '43000000-0000-0000-0000-000000000011',
      establishmentId,
      name: 'Current product name',
      unit: 'kg',
    })
    const brand: Brand = {
      id: '43000000-0000-0000-0000-000000000012',
      productId: product.id,
      name: 'Current brand name',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    }
    const productsRepository = {
      findById: vi.fn().mockResolvedValue(product),
    }
    const brandsRepository = {
      findById: vi.fn().mockResolvedValue(brand),
    }
    const stockBalancesRepository = {
      add: vi.fn().mockResolvedValue({ productId: product.id, quantity: 17 }),
    } as unknown as StockBalancesRepository
    const stockTransactionsRepository = {
      add: vi.fn().mockResolvedValue({}),
    } as unknown as StockTransactionsRepository
    const restorer = new TransactionBoundStockRestorer(
      productsRepository as unknown as ProductsRepository,
      brandsRepository as unknown as BrandsRepository,
      stockBalancesRepository,
      stockTransactionsRepository,
    )
    const request: StockRestorationRequest = {
      establishmentId,
      orderId,
      performedBy: actorId,
      performedByName: 'Canceling Manager',
      occurredAt,
      targets: [
        {
          productId: product.id,
          productName: 'Original product snapshot',
          brandId: brand.id,
          brandName: 'Original brand snapshot',
          quantity: 2.5,
        },
      ],
    }

    await expect(restorer.restore(request)).resolves.toEqual([
      {
        productId: product.id,
        productName: 'Original product snapshot',
        brandId: brand.id,
        brandName: 'Original brand snapshot',
        quantity: 2.5,
        outcome: 'restored',
      },
    ])
    expect(stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: product.id, brandId: brand.id },
      2.5,
    )
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: product.id,
      brandId: brand.id,
      brandName: 'Original brand snapshot',
      orderId,
      productName: 'Original product snapshot',
      unit: 'kg',
      type: 'sale-cancellation',
      quantity: 2.5,
      balanceAfter: 17,
      performedBy: actorId,
      performedByName: 'Canceling Manager',
      occurredAt,
    })
  })

  it('returns ordered skipped facts for missing products and brands without changing stock', async () => {
    const product = ProductFaker.fake({
      id: '43000000-0000-0000-0000-000000000021',
      establishmentId,
    })
    const productsRepository = {
      findById: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(product),
    }
    const brandsRepository = {
      findById: vi.fn().mockResolvedValue(undefined),
    }
    const stockBalancesRepository = {
      add: vi.fn(),
    } as unknown as StockBalancesRepository
    const stockTransactionsRepository = {
      add: vi.fn(),
    } as unknown as StockTransactionsRepository
    const restorer = new TransactionBoundStockRestorer(
      productsRepository as unknown as ProductsRepository,
      brandsRepository as unknown as BrandsRepository,
      stockBalancesRepository,
      stockTransactionsRepository,
    )
    const request = {
      establishmentId,
      orderId,
      performedBy: actorId,
      performedByName: 'Manager',
      occurredAt,
      targets: [
        {
          productId: '43000000-0000-0000-0000-000000000020',
          productName: 'Deleted product snapshot',
          quantity: 1,
        },
        {
          productId: product.id,
          productName: 'Product snapshot',
          brandId: '43000000-0000-0000-0000-000000000022',
          brandName: 'Deleted brand snapshot',
          quantity: 3,
        },
      ],
    } satisfies StockRestorationRequest

    await expect(restorer.restore(request)).resolves.toEqual([
      {
        productId: request.targets[0].productId,
        productName: 'Deleted product snapshot',
        quantity: 1,
        outcome: 'skipped',
      },
      {
        productId: product.id,
        productName: 'Product snapshot',
        brandId: request.targets[1].brandId,
        brandName: 'Deleted brand snapshot',
        quantity: 3,
        outcome: 'skipped',
      },
    ])
    expect(stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(stockTransactionsRepository.add).not.toHaveBeenCalled()
  })

  it('propagates an eligible target failure so the enclosing serializable transaction can roll back prior writes', async () => {
    const firstProduct = ProductFaker.fake({
      id: '43000000-0000-0000-0000-000000000031',
      establishmentId,
    })
    const secondProduct = ProductFaker.fake({
      id: '43000000-0000-0000-0000-000000000032',
      establishmentId,
    })
    const productsRepository = {
      findById: vi
        .fn()
        .mockResolvedValueOnce(firstProduct)
        .mockResolvedValueOnce(secondProduct),
    }
    const brandsRepository = { findById: vi.fn() }
    const stockBalancesRepository = {
      add: vi
        .fn()
        .mockResolvedValueOnce({ productId: firstProduct.id, quantity: 8 })
        .mockRejectedValueOnce(new Error('injected balance failure')),
    } as unknown as StockBalancesRepository
    const stockTransactionsRepository = {
      add: vi.fn().mockResolvedValue({}),
    } as unknown as StockTransactionsRepository
    const restorer = new TransactionBoundStockRestorer(
      productsRepository as unknown as ProductsRepository,
      brandsRepository as unknown as BrandsRepository,
      stockBalancesRepository,
      stockTransactionsRepository,
    )

    await expect(
      restorer.restore({
        establishmentId,
        orderId,
        performedBy: actorId,
        performedByName: 'Manager',
        occurredAt,
        targets: [
          {
            productId: firstProduct.id,
            productName: 'First snapshot',
            quantity: 1,
          },
          {
            productId: secondProduct.id,
            productName: 'Second snapshot',
            quantity: 2,
          },
        ],
      }),
    ).rejects.toThrow('injected balance failure')
    expect(stockTransactionsRepository.add).toHaveBeenCalledTimes(1)
  })

  it('retries a serialization conflict once and exposes every transaction-bound dependency', async () => {
    const transaction = vi
      .fn()
      .mockRejectedValueOnce({ code: '40001' })
      .mockImplementationOnce(async (operation: (executor: object) => Promise<unknown>) =>
        operation({}),
      )
    const stockRestorer = {}
    const dependenciesFactory = {
      forExecutor: vi.fn().mockReturnValue({
        salesCatalogProvider: {},
        stockConsumer: {},
        stockRestorer,
      }),
    }
    const database = new DrizzlePdvDatabase(
      { requireDatabase: () => ({ transaction }) } as never,
      dependenciesFactory as never,
    )

    await expect(
      database.run(async (scope) => {
        expect(scope.stockRestorer).toBe(stockRestorer)
        expect(scope.stockConsumer).toBeDefined()
        expect(scope.salesCatalogProvider).toBeDefined()
        return 'committed'
      }),
    ).resolves.toBe('committed')
    expect(transaction).toHaveBeenCalledTimes(2)
    expect(transaction.mock.calls[1]?.[1]).toMatchObject({
      isolationLevel: 'serializable',
      accessMode: 'read write',
    })
  })

  it('propagates operation failures to the transaction owner for rollback', async () => {
    const transaction = vi
      .fn()
      .mockImplementation(async (operation: (executor: object) => Promise<unknown>) =>
        operation({}),
      )
    const database = new DrizzlePdvDatabase(
      { requireDatabase: () => ({ transaction }) } as never,
      {
        forExecutor: vi.fn().mockReturnValue({
          salesCatalogProvider: {},
          stockConsumer: {},
          stockRestorer: {},
        }),
      } as never,
    )
    const failure = new Error('injected transaction failure')

    await expect(database.run(async () => Promise.reject(failure))).rejects.toBe(failure)
    expect(transaction).toHaveBeenCalledTimes(1)
  })
})
