import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import type { BrandsRepository } from '#mrp/interfaces/brands-repository.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
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

const validSingleStockRequest: Parameters<RegisterProductUseCase['execute']>[0] = {
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
}

describe('Register Product Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let eventsRepository: MockProxy<EventsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let scope: MockProxy<MrpDatabaseRepositories>
  let brandsRepository: MockProxy<BrandsRepository>
  let productsRepository: MockProxy<ProductsRepository>
  let stockBalancesRepository: MockProxy<StockBalancesRepository>
  let stockTransactionsRepository: MockProxy<StockTransactionsRepository>
  let useCase: RegisterProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    eventsRepository = mock<EventsRepository>()
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
      eventsRepository,
    } as unknown as MockProxy<MrpDatabaseRepositories>
    productsRepository.findByName.mockResolvedValue(undefined)
    productsRepository.add.mockResolvedValue(product)
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new RegisterProductUseCase(database, datetimeProvider)
  })

  it('creates an active single-stock product and records the event in the transaction', async () => {
    const order: string[] = []
    productsRepository.add.mockImplementation(async (input) => {
      order.push('product')
      return { ...product, ...input }
    })
    stockBalancesRepository.initialize.mockImplementation(async () => {
      order.push('stock')
    })
    eventsRepository.add.mockImplementation(async (event) => {
      order.push('event')
      expect(
        event instanceof ProductCreatedEvent ||
          event instanceof ProductStockAlertStateEnteredEvent,
      ).toBe(true)
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
    expect(productsRepository.findByName).toHaveBeenCalledWith('establishment-1', 'Milk')
    expect(order).toEqual(['product', 'stock', 'event', 'event'])
    expect(eventsRepository.add).toHaveBeenNthCalledWith(
      1,
      expect.any(ProductStockAlertStateEnteredEvent),
    )
    expect(eventsRepository.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: ProductCreatedEvent._NAME,
        payload: expect.objectContaining({
          productId: product.id,
          establishmentId: 'establishment-1',
          createdAt: product.createdAt,
        }),
      }),
    )
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

  it('persists the selected main brand and records only positive initial stock', async () => {
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
        {
          name: ' A ',
          unit: ProductUnit.Unit,
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 3,
          isPrimary: false,
        },
        {
          name: 'B',
          packageQuantity: 1,
          packageValue: 4,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    })

    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'A', unit: ProductUnit.Unit, isPrimary: false }),
    )
    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ isPrimary: true }),
    )
    expect(stockBalancesRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entry',
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
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: -3,
          isPrimary: true,
        },
      ],
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
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects non-manager registration without starting a transaction', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          name: 'Operator',
          establishmentId: 'establishment-1',
          profile: UserProfile.Operator,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    expect(database.run).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
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

  it.each([
    ['a blank name', { name: '   ' }],
    ['a product without categories', { categories: [] }],
    [
      'a product classified as both portion and resale',
      { categories: [ProductCategory.Portion, ProductCategory.Resale] },
    ],
    [
      'a manufacturable product with brand stock',
      {
        categories: [ProductCategory.Manufacturable],
        stockControl: ProductStockControl.ByBrand,
        brands: [
          {
            name: 'House',
            packageQuantity: 1,
            packageValue: 5,
            initialQuantity: 0,
            isPrimary: true,
          },
        ],
      },
    ],
    ['a negative ideal stock quantity', { idealStock: -1 }],
    ['negative initial stock when negative stock is disabled', { initialStock: -1 }],
    [
      'a unit cost on a non-ingredient',
      { categories: [ProductCategory.Portion], currentUnitCost: 2 },
    ],
    ['a unit cost with excess decimal places', { currentUnitCost: 1.1234567 }],
  ])('rejects %s before starting registration', async (_description, overrides) => {
    await expect(
      useCase.execute({ ...validSingleStockRequest, ...overrides }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a missing ideal stock quantity before starting registration', async () => {
    const request = {
      ...validSingleStockRequest,
      idealStock: undefined,
    } as unknown as Parameters<RegisterProductUseCase['execute']>[0]

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('omits an unspecified current unit cost and skips zero initial stock movements', async () => {
    await useCase.execute({ ...validSingleStockRequest, initialStock: 0 })

    const savedInput = productsRepository.add.mock.calls[0]?.[0]
    expect(savedInput).toBeDefined()
    expect(Object.hasOwn(savedInput ?? {}, 'currentUnitCost')).toBe(false)
    expect(stockBalancesRepository.initialize).toHaveBeenCalledWith(product.id)
    expect(stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(stockTransactionsRepository.add).not.toHaveBeenCalled()
  })

  it('records positive initial stock as an entry using the fixed event time', async () => {
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      quantity: 4,
      situation: 'normal',
    })

    await useCase.execute({ ...validSingleStockRequest, initialStock: 4 })

    expect(stockBalancesRepository.initialize).toHaveBeenCalledWith(product.id)
    expect(stockBalancesRepository.add).toHaveBeenCalledWith({ productId: product.id }, 4)
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entry',
        quantity: 4,
        balanceAfter: 4,
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    )
  })

  it('reports the duplicate product conflict with the actionable message', async () => {
    productsRepository.findByName.mockResolvedValue(product)

    await expect(useCase.execute(validSingleStockRequest)).rejects.toThrow(
      'Já existe um produto com esse nome neste estabelecimento.',
    )

    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    {
      description: 'no selected brand',
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 0,
          isPrimary: false,
        },
      ],
    },
    {
      description: 'multiple selected brands',
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 0,
          isPrimary: true,
        },
        {
          name: 'B',
          packageQuantity: 1,
          packageValue: 4,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    },
  ])('rejects $description before starting registration', async ({ brands }) => {
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
        stockControl: ProductStockControl.ByBrand,
        idealStock: 0,
        brands,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })
})
