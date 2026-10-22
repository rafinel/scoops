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
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import { ProductAccompanimentFaker } from '#mrp/domain/entities/fakers/index.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RemoveProductBrandUseCase } from '#mrp/use-cases/remove-product-brand-use-case.ts'

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
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Remove Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RemoveProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [],
    )
    useCase = new RemoveProductBrandUseCase(database)
  })
  it('requires replacement before removing main brand', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(2)
    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'b1' }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
  })
  it('removes a non-main or last brand', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.remove).toHaveBeenCalledWith('p1', 'b1')
    scope.brandsRepository.findById.mockResolvedValue({ ...brand, isPrimary: false })
    scope.brandsRepository.countByProductId.mockResolvedValue(2)
    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })
    expect(scope.brandsRepository.remove).toHaveBeenCalledTimes(2)
  })

  it('publishes the configuration of the product without the removed brand', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product })],
    )

    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1'])
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
          resaleConfigurations: [],
          updatedAt: product.updatedAt,
        },
      }),
    )
  })

  it('publishes nothing for a requested product that is missing from the establishment', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [],
    )

    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('skips a source product from another establishment', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({
          product: { ...product, establishmentId: 'e2' },
        }),
      ],
    )

    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('does not publish when the removal is rejected', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(2)

    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'b1' }),
    ).rejects.toBeInstanceOf(ConflictError)

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: 'p1',
        brandId: 'b1',
      }),
    ).rejects.toThrow(new AuthorizationError('Somente gestores podem remover marcas.'))

    expect(database.run).not.toHaveBeenCalled()
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('reports a missing product with its message and writes nothing', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'b1' }),
    ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))

    expect(scope.productsRepository.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.brandsRepository.findById).not.toHaveBeenCalled()
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('reports a missing brand with its message and writes nothing', async () => {
    scope.brandsRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'missing' }),
    ).rejects.toThrow(new NotFoundError('Marca não encontrada.'))

    expect(scope.brandsRepository.findById).toHaveBeenCalledWith('p1', 'missing')
    expect(scope.brandsRepository.countByProductId).not.toHaveBeenCalled()
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('asks for another main brand with the replacement message and publishes nothing', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(2)

    await expect(
      useCase.execute({ actor, productId: 'p1', brandId: 'b1' }),
    ).rejects.toThrow(
      new ConflictError('Defina outra marca como principal antes de remover esta marca.'),
    )

    expect(scope.brandsRepository.countByProductId).toHaveBeenCalledWith('p1')
    expect(scope.brandsRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('removes the brand before republishing the product and its same-tenant inverse owners once', async () => {
    const owner = { ...product, id: 'portion-1', categories: [ProductCategory.Portion] }
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: owner.id,
          accompanimentProductId: 'p1',
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: owner.id,
          accompanimentProductId: 'p1',
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'e2',
          productId: 'foreign-portion',
          accompanimentProductId: 'p1',
        }),
      ],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({ product }),
        ProductSalesConfigurationSourceFaker.fake({ product: owner }),
      ],
    )

    await useCase.execute({ actor, productId: 'p1', brandId: 'b1' })

    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledExactlyOnceWith('e1', 'p1')
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1', owner.id])
    expect(scope.brandsRepository.remove.mock.invocationCallOrder[0]).toBeLessThan(
      scope.eventsRepository.add.mock.invocationCallOrder[0],
    )
    expect(
      scope.eventsRepository.add.mock.calls.map(
        ([event]) => (event as ProductSalesConfigurationChangedEvent).payload.productId,
      ),
    ).toEqual(['p1', owner.id])
  })
})
