import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  ProductAccompanimentFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { SetPrimaryProductBrandUseCase } from '#mrp/use-cases/set-primary-product-brand-use-case.ts'

const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }
const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.ByBrand,
  status: ProductStatus.Active,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const brand: Brand = {
  id: 'b1',
  productId: 'p1',
  name: 'A',
  packageQuantity: 2,
  packagePrice: 10,
  isPrimary: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Set Primary Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: SetPrimaryProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.brandsRepository.setPrimary.mockResolvedValue({ ...brand, isPrimary: true })
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 2,
      situation: StockSituation.Normal,
    })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product })],
    )
    useCase = new SetPrimaryProductBrandUseCase(database)
  })
  it('exchanges one main brand atomically and is idempotent', async () => {
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.setPrimary).toHaveBeenCalledTimes(1)
    scope.brandsRepository.findById.mockResolvedValue({ ...brand, isPrimary: true })
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.setPrimary).toHaveBeenCalledTimes(1)
  })
  it('hides foreign or missing brands', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: 'foreign', brandId: 'b1' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  const run = () => useCase.execute({ actor, productId: 'p1', brandId: 'b1' })

  it('only lets managers define the primary brand', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: 'p1',
        brandId: 'b1',
      }),
    ).rejects.toThrow(
      new AuthorizationError('Somente gestores podem definir a marca principal.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('looks the product up by establishment and the brand by product', async () => {
    await run()
    expect(scope.productsRepository.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.brandsRepository.findById).toHaveBeenCalledWith('p1', 'b1')
    expect(scope.brandsRepository.setPrimary).toHaveBeenCalledWith('p1', 'b1')
  })

  it('returns the promoted brand with its stock and unit price', async () => {
    await expect(run()).resolves.toEqual({
      brand: { ...brand, isPrimary: true },
      stockQuantity: 2,
      unitPrice: 5,
    })
    expect(scope.stockBalancesRepository.findByProductAndBrand).toHaveBeenCalledWith(
      'p1',
      'b1',
    )
  })

  it('returns the current brand untouched when it is already primary', async () => {
    const primary = { ...brand, isPrimary: true, packagePrice: 9, packageQuantity: 3 }
    scope.brandsRepository.findById.mockResolvedValue(primary)
    await expect(run()).resolves.toEqual({
      brand: primary,
      stockQuantity: 2,
      unitPrice: 3,
    })
    expect(scope.brandsRepository.setPrimary).not.toHaveBeenCalled()
  })

  it('reports zero stock when the brand has no balance', async () => {
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue(undefined)
    await expect(run()).resolves.toMatchObject({ stockQuantity: 0 })
  })

  it('hides missing products and brands with their own messages', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(run()).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(undefined)
    await expect(run()).rejects.toThrow(new NotFoundError('Marca não encontrada.'))
    expect(scope.brandsRepository.setPrimary).not.toHaveBeenCalled()
  })

  it('publishes the refreshed sales configuration of the product', async () => {
    await run()
    expect(scope.eventsRepository.add).toHaveBeenCalledTimes(1)
    expect(scope.eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({
          establishmentId: 'e1',
          productId: 'p1',
          state: 'available',
        }),
      }),
    )
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1'])
  })

  it('publishes the brand names and the latest brand update of a By-brand product', async () => {
    const brandUpdatedAt = new Date('2030-01-01T00:00:00.000Z')
    const promoted = { ...brand, isPrimary: true, updatedAt: brandUpdatedAt }
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({
          product,
          brands: [promoted],
          resaleConfigurations: [
            ResaleConfigurationFaker.fake({
              establishmentId: 'e1',
              productId: 'p1',
              brandId: 'b1',
              price: 18,
              isActive: true,
              updatedAt: new Date('2029-01-01T00:00:00.000Z'),
            }),
          ],
        }),
      ],
    )

    await run()

    expect(scope.eventsRepository.add).toHaveBeenCalledExactlyOnceWith(
      new ProductSalesConfigurationChangedEvent({
        establishmentId: 'e1',
        productId: 'p1',
        state: 'available',
        configuration: {
          establishmentId: 'e1',
          productId: 'p1',
          name: 'Milk',
          categories: [ProductCategory.Ingredient],
          status: ProductStatus.Active,
          stockControl: ProductStockControl.ByBrand,
          sizes: [],
          resaleConfigurations: [
            { brandId: 'b1', brandName: promoted.name, price: 18, isActive: true },
          ],
          updatedAt: brandUpdatedAt,
        },
      }),
    )
  })

  it('republishes every Portion that uses the product as an accompaniment after the product itself', async () => {
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: 'portion-1',
          accompanimentProductId: 'p1',
        }),
      ],
    )

    await run()

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1', 'portion-1'])
  })

  it('publishes nothing when the brand is missing', async () => {
    scope.brandsRepository.findById.mockResolvedValue(undefined)

    await expect(run()).rejects.toBeInstanceOf(NotFoundError)

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })
})
