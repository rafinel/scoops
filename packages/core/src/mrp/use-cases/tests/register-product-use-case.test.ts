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
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
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
  let scope: MockProxy<MrpDatabaseScope>
  let productsRepository: MockProxy<ProductsRepository>
  let stockBalancesRepository: MockProxy<StockBalancesRepository>
  let useCase: RegisterProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    broker = mock<Broker>()
    productsRepository = mock<ProductsRepository>()
    stockBalancesRepository = mock<StockBalancesRepository>()
    scope = {
      productsRepository,
      stockBalancesRepository,
    } as unknown as MockProxy<MrpDatabaseScope>
    productsRepository.findByName.mockResolvedValue(undefined)
    productsRepository.add.mockResolvedValue(product)
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new RegisterProductUseCase(database, broker)
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

  it('rejects duplicate and invalid registrations without persistence or events', async () => {
    productsRepository.findByName.mockResolvedValue(product)

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
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
})
