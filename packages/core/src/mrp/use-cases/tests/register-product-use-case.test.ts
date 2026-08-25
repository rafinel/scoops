import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import type { BrandsRepository } from '#mrp/interfaces/brands-repository.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { BadRequestError, ConflictError } from '#shared/domain/errors/index.ts'
import { RegisterProductUseCase } from '#mrp/use-cases/register-product-use-case.ts'

const product: Product = {
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  status: ProductStatus.Active,
  allowNegativeStock: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('Register Product Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let broker: MockProxy<Broker>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let scope: MockProxy<MrpDatabaseScope>
  let brandsRepository: MockProxy<BrandsRepository>
  let productsRepository: MockProxy<ProductsRepository>
  let stockBalancesRepository: MockProxy<StockBalancesRepository>
  let stockTransactionsRepository: MockProxy<StockTransactionsRepository>
  let useCase: RegisterProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    broker = mock<Broker>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    brandsRepository = mock<BrandsRepository>()
    productsRepository = mock<ProductsRepository>()
    stockBalancesRepository = mock<StockBalancesRepository>()
    stockTransactionsRepository = mock<StockTransactionsRepository>()
    scope = {
      brandsRepository,
      productsRepository,
      stockBalancesRepository,
      stockTransactionsRepository,
    } as unknown as MockProxy<MrpDatabaseScope>
    productsRepository.findByName.mockResolvedValue(undefined)
    productsRepository.add.mockResolvedValue(product)
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new RegisterProductUseCase(database, broker, datetimeProvider)
  })

  it('creates an active single-stock product and publishes after initialization', async () => {
    const order: string[] = []
    productsRepository.add.mockImplementation(async (input) => {
      order.push('product')
      return { ...product, ...input }
    })
    stockBalancesRepository.initialize.mockImplementation(async () => {
      order.push('stock')
    })
    broker.publish.mockImplementation(async (event) => {
      order.push('event')
      expect(event).toBeInstanceOf(ProductCreatedEvent)
    })

    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: '  Milk  ',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      allowNegativeStock: false,
      idealStock: 10,
    })

    expect(result.name).toBe('Milk')
    expect(productsRepository.add).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 10,
    })
    expect(order).toEqual(['product', 'stock', 'event'])
  })

  it('persists when a product allows negative stock', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      allowNegativeStock: true,
      idealStock: 0,
    })

    expect(productsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ allowNegativeStock: true }),
    )
  })

  it('persists a valid single-stock ingredient current unit cost', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      idealStock: 0,
      currentUnitCost: 0,
    })

    expect(productsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ currentUnitCost: 0 }),
    )
  })

  it('derives the first main brand and records only positive initial stock', async () => {
    productsRepository.add.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
    })
    brandsRepository.add
      .mockResolvedValueOnce({
        id: 'brand-1',
        productId: product.id,
        name: 'A',
        packageQuantity: 2,
        packagePrice: 10,
        isPrimary: true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .mockResolvedValueOnce({
        id: 'brand-2',
        productId: product.id,
        name: 'B',
        packageQuantity: 1,
        packagePrice: 4,
        isPrimary: false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      brandId: 'brand-1',
      quantity: 3,
      situation: 'normal',
    })

    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      idealStock: 3,
      initialStock: 3,
      brands: [
        { name: 'A', packageQuantity: 2, packageValue: 10, initialQuantity: 3 },
        { name: 'B', packageQuantity: 1, packageValue: 4, initialQuantity: 0 },
      ],
    })

    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ isPrimary: true }),
    )
    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ isPrimary: false }),
    )
    expect(stockBalancesRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        brandName: 'A',
        quantity: 3,
        balanceAfter: 3,
        performedByName: 'Manager',
      }),
    )
  })

  it('records negative initial stock for brands when negative stock is enabled', async () => {
    productsRepository.add.mockResolvedValue({
      ...product,
      allowNegativeStock: true,
      stockControl: ProductStockControl.ByBrand,
    })
    brandsRepository.add.mockResolvedValue({
      id: 'brand-1',
      productId: product.id,
      name: 'A',
      packageQuantity: 2,
      packagePrice: 10,
      isPrimary: true,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      brandId: 'brand-1',
      quantity: -3,
      situation: 'normal',
    })

    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      allowNegativeStock: true,
      idealStock: 0,
      initialStock: -3,
      brands: [{ name: 'A', packageQuantity: 2, packageValue: 10, initialQuantity: -3 }],
    })

    expect(stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: product.id, brandId: 'brand-1' },
      -3,
    )
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'write-off',
        quantity: 3,
        balanceAfter: -3,
      }),
    )
  })

  it('rejects duplicate and invalid registrations without persistence or events', async () => {
    productsRepository.findByName.mockResolvedValue(product)

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    productsRepository.findByName.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Cake',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
        stockControl: ProductStockControl.Single,
        idealStock: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects invalid current unit costs without persistence', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
        currentUnitCost: -0.01,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(productsRepository.add).not.toHaveBeenCalled()
  })
})
