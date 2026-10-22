import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateProductSizeUseCase } from '#mrp/use-cases/update-product-size-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const product = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
  currentUnitCost: undefined,
})
const size = ProductSizeFaker.fake({
  id: 'size-1',
  establishmentId,
  productId: product.id,
  name: 'Small',
  isActive: true,
})
const secondSize = ProductSizeFaker.fake({
  id: 'size-2',
  establishmentId,
  productId: product.id,
  name: 'Large',
  isActive: true,
})
const updatedSize = {
  ...size,
  name: 'Medium',
  quantity: 1.25,
  price: 11.5,
  isActive: false,
}

describe('Update Product Size Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: UpdateProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findById.mockResolvedValue(size)
    scope.productSizesRepository.findManyByProductId
      .mockResolvedValueOnce([size, secondSize])
      .mockResolvedValueOnce([updatedSize, secondSize])
    scope.productSizesRepository.countActive.mockResolvedValue(2)
    scope.productSizesRepository.replace.mockResolvedValue(updatedSize)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [],
    )
    useCase = new UpdateProductSizeUseCase(database)
  })

  it('normalizes and replaces editable fields, including status', async () => {
    const result = await useCase.execute({
      actor,
      productId: product.id,
      sizeId: size.id,
      input: { name: '  Medium  ', quantity: 1.25, price: 11.5, isActive: false },
    })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      { name: 'Medium', quantity: 1.25, price: 11.5, isActive: false },
    )
    expect(result.sizes[0].size).toBe(updatedSize)
  })

  it('protects the final active size inside the transaction', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.productSizesRepository.countActive.mockResolvedValue(1)

    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: size.id,
        input: { name: 'Small', quantity: 1, price: 10, isActive: false },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productSizesRepository.countActive).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects duplicate names, foreign sizes and non-Managers without partial writes', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size, secondSize])
    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: size.id,
        input: { name: ' large ', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()

    scope.productSizesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: 'foreign-size',
        input: { name: 'Other', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        sizeId: size.id,
        input: { name: 'Other', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
  type Input = { name: string; quantity: number; price: number; isActive: boolean }
  const valid: Input = { name: 'Medium', quantity: 1, price: 10, isActive: true }
  const update = (input: Partial<Input> = {}, overrides: Partial<ProductActor> = {}) =>
    useCase.execute({
      actor: { ...actor, ...overrides },
      productId: product.id,
      sizeId: size.id,
      input: { ...valid, ...input },
    })

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    await expect(update({}, { profile: UserProfile.Operator })).rejects.toThrow(
      new AuthorizationError('Somente gestores podem editar tamanhos.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['empty', ''],
    ['blank', '   '],
    ['over 120 characters', 'a'.repeat(121)],
    ['over 120 characters with outer spaces', ` ${'a'.repeat(121)} `],
  ])('rejects a %s name with the name message', async (_label, name) => {
    await expect(update({ name })).rejects.toThrow(
      new BadRequestError('O nome do tamanho deve possuir entre 1 e 120 caracteres.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts a name with exactly 120 characters', async () => {
    const name = 'a'.repeat(120)

    await update({ name })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      expect.objectContaining({ name }),
    )
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['with four decimal places', 1.0001],
    ['at the numeric(18,3) limit', 1_000_000_000_000_000],
  ])('rejects a %s quantity with the quantity message', async (_label, quantity) => {
    await expect(update({ quantity })).rejects.toThrow(
      new BadRequestError(
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['negative', -0.01],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['with three decimal places', 1.005],
    ['at the numeric(18,2) limit', 10_000_000_000_000_000],
  ])('rejects a %s price with the price message', async (_label, price) => {
    await expect(update({ price })).rejects.toThrow(
      new BadRequestError(
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects a non-boolean status with the status message', async () => {
    await expect(update({ isActive: undefined as unknown as boolean })).rejects.toThrow(
      new BadRequestError('O status do tamanho é obrigatório.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts the largest quantity and price below the numeric limits', async () => {
    await update({ quantity: 999_999_999_999_999, price: 9_999_999_999_999_998 })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      expect.objectContaining({
        quantity: 999_999_999_999_999,
        price: 9_999_999_999_999_998,
      }),
    )
  })

  it('accepts a quantity with three decimals and a price with two decimals', async () => {
    await update({ quantity: 1234567.891, price: 1234567.89 })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      expect.objectContaining({ quantity: 1234567.891, price: 1234567.89 }),
    )
  })

  it('accepts the smallest positive quantity with three decimals and a zero price', async () => {
    await update({ quantity: 0.001, price: 0 })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      { name: 'Medium', quantity: 0.001, price: 0, isActive: true },
    )
  })

  it('looks the product, the size and its siblings up scoped to the establishment', async () => {
    await update()

    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
    expect(scope.productSizesRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
    )
    expect(scope.productSizesRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
  })

  it('reports a missing product with the not-found message', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)

    await expect(update()).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('reports a product from another establishment as not found', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId: 'establishment-2',
        categories: [ProductCategory.Portion],
      }),
    )

    await expect(update()).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects products that are not portions', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Manufacturable],
      }),
    )

    await expect(update()).rejects.toThrow(
      new BadRequestError('O produto não é uma porção.'),
    )
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects products that are both portion and resale', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      }),
    )

    await expect(update()).rejects.toThrow(
      new BadRequestError('Porção e Revenda não podem ser usadas juntas.'),
    )
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it.each([
    ['from another establishment', { establishmentId: 'establishment-2' }],
    ['from another product', { productId: 'other-product' }],
  ])('reports a size %s as not found', async (_label, override) => {
    scope.productSizesRepository.findById.mockResolvedValue(
      ProductSizeFaker.fake({ ...size, ...override }),
    )

    await expect(update()).rejects.toThrow(new NotFoundError('Tamanho não encontrado.'))
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('reports a missing size with the not-found message', async () => {
    scope.productSizesRepository.findById.mockResolvedValue(undefined)

    await expect(update()).rejects.toThrow(new NotFoundError('Tamanho não encontrado.'))
  })

  it('reports duplicates with the conflict message and ignores the edited size itself', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size, secondSize])

    await expect(update({ name: '  LARGE ' })).rejects.toThrow(
      new ConflictError('Já existe um tamanho com esse nome para o produto.'),
    )
    await expect(update({ name: ' small ' })).resolves.toBeDefined()
  })

  it('does not count active sizes when the size stays active', async () => {
    await update({ isActive: true })

    expect(scope.productSizesRepository.countActive).not.toHaveBeenCalled()
  })

  it('does not count active sizes when an inactive size stays inactive', async () => {
    scope.productSizesRepository.findById.mockResolvedValue(
      ProductSizeFaker.fake({ ...size, isActive: false }),
    )

    await update({ isActive: false })

    expect(scope.productSizesRepository.countActive).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.replace).toHaveBeenCalled()
  })

  it('allows deactivating when two active sizes exist and reports the last-active message otherwise', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size, secondSize])
    scope.productSizesRepository.countActive.mockResolvedValue(2)
    await update({ isActive: false })
    expect(scope.productSizesRepository.replace).toHaveBeenCalledTimes(1)

    scope.productSizesRepository.countActive.mockResolvedValue(1)
    await expect(update({ isActive: false })).rejects.toThrow(
      new ConflictError('A porção deve possuir pelo menos um tamanho ativo.'),
    )
  })

  it('allows reactivating an inactive size without counting', async () => {
    scope.productSizesRepository.findById.mockResolvedValue(
      ProductSizeFaker.fake({ ...size, isActive: false }),
    )

    await update({ isActive: true })

    expect(scope.productSizesRepository.countActive).not.toHaveBeenCalled()
    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      expect.objectContaining({ isActive: true }),
    )
  })

  it('publishes the complete tenant-qualified current sales configuration of the Portion', async () => {
    const updatedAt = new Date('2026-02-01T00:00:00.000Z')
    const published = ProductFaker.fake({
      ...product,
      name: 'Açaí',
      updatedAt,
    })
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product: published })],
    )

    await update()

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [product.id])
    expect(scope.eventsRepository.add).toHaveBeenCalledExactlyOnceWith(
      new ProductSalesConfigurationChangedEvent({
        establishmentId,
        productId: product.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: product.id,
          name: 'Açaí',
          categories: [ProductCategory.Portion],
          status: published.status,
          stockControl: published.stockControl,
          sizes: [],
          resaleConfigurations: [],
          updatedAt,
        },
      }),
    )
  })

  it('publishes the saved Product price once and leaves unpriced legacy links unavailable', async () => {
    const ownerUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
    const accompanimentUpdatedAt = new Date('2026-01-02T00:00:00.000Z')
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId,
      categories: [ProductCategory.Accompaniment],
      updatedAt: accompanimentUpdatedAt,
    })
    const accompanimentType = AccompanimentTypeFaker.fake({
      id: 'type-1',
      establishmentId,
      updatedAt: ownerUpdatedAt,
    })
    const accompanimentLink = ProductAccompanimentFaker.fake({
      id: 'link-1',
      establishmentId,
      productId: product.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: accompanimentType.id,
      accompanimentPrice: 2.75,
      updatedAt: ownerUpdatedAt,
    })
    const sourceWith = (link: typeof accompanimentLink) =>
      ProductSalesConfigurationSourceFaker.fake({
        product: { ...product, updatedAt: ownerUpdatedAt },
        sizes: [{ ...size, updatedAt: ownerUpdatedAt }],
        links: [link],
        accompanimentProducts: [accompaniment],
        accompanimentTypes: [accompanimentType],
      })
    const publishedEvent = () =>
      scope.eventsRepository.add.mock.calls.at(
        -1,
      )?.[0] as ProductSalesConfigurationChangedEvent
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [sourceWith(accompanimentLink)],
    )

    await update()

    expect(
      publishedEvent().payload.configuration?.sizes[0]?.accompaniments[0],
    ).toMatchObject({ basePrice: 2.75, isActive: true })
    expect(publishedEvent().payload.configuration?.updatedAt).toEqual(
      accompanimentUpdatedAt,
    )

    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size, secondSize])
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [sourceWith({ ...accompanimentLink, accompanimentPrice: undefined })],
    )
    await update()

    expect(
      publishedEvent().payload.configuration?.sizes[0]?.accompaniments[0],
    ).toMatchObject({ basePrice: 0, isActive: false })
  })

  describe('rows that reference a global', () => {
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId,
      categories: [ProductCategory.Accompaniment],
      accompanimentPrice: 9.99,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    const accompanimentType = AccompanimentTypeFaker.fake({
      id: 'type-1',
      establishmentId,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    const globalLink = ProductAccompanimentFaker.fake({
      id: 'link-1',
      establishmentId,
      productId: product.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: accompanimentType.id,
      globalAccompanimentId: 'global-1',
      accompanimentPrice: 1,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    const sourceWithGlobals = (
      globals: ReturnType<typeof GlobalAccompanimentFaker.fake>[],
    ) =>
      ProductSalesConfigurationSourceFaker.fake({
        product: { ...product, updatedAt: new Date('2026-01-01T00:00:00.000Z') },
        sizes: [{ ...size, updatedAt: new Date('2026-01-01T00:00:00.000Z') }],
        links: [globalLink],
        accompanimentProducts: [accompaniment],
        accompanimentTypes: [accompanimentType],
        globals,
      })
    const publishedConfiguration = () => {
      const [event] = scope.eventsRepository.add.mock.calls.at(-1) ?? []
      return (event as ProductSalesConfigurationChangedEvent | undefined)?.payload
        .configuration
    }

    it("publishes the global's price instead of the row's own price or the default", async () => {
      const global = GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentPrice: 6.5,
        updatedAt: new Date('2026-01-09T00:00:00.000Z'),
      })
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [sourceWithGlobals([global])],
      )

      await update()

      expect(publishedConfiguration()?.sizes[0]?.accompaniments[0]).toMatchObject({
        accompanimentId: 'link-1',
        basePrice: 6.5,
        isActive: true,
      })
    })

    it("counts the global's update time among the facts of the rows that reference it", async () => {
      const global = GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentPrice: 6.5,
        updatedAt: new Date('2026-01-09T00:00:00.000Z'),
      })
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [sourceWithGlobals([global])],
      )

      await update()

      expect(publishedConfiguration()?.updatedAt).toEqual(
        new Date('2026-01-09T00:00:00.000Z'),
      )
    })

    it('keeps a row unavailable when its global has no price', async () => {
      const global = GlobalAccompanimentFaker.fake({
        id: 'global-1',
        establishmentId,
        accompanimentProductId: accompaniment.id,
        accompanimentPrice: undefined,
      })
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [sourceWithGlobals([global])],
      )

      await update()

      expect(publishedConfiguration()?.sizes[0]?.accompaniments[0]).toMatchObject({
        basePrice: 0,
        isActive: false,
      })
    })

    it.each([
      { name: 'missing', globals: [] },
      {
        name: 'foreign',
        globals: [
          GlobalAccompanimentFaker.fake({
            id: 'global-1',
            establishmentId: 'establishment-2',
            accompanimentProductId: accompaniment.id,
            accompanimentPrice: 6.5,
          }),
        ],
      },
    ])('fails when the referenced global is $name', async ({ globals }) => {
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
        [sourceWithGlobals(globals)],
      )

      await expect(update()).rejects.toThrow(
        new NotFoundError('A configuração de acompanhamento não foi encontrada.'),
      )
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })
  })

  it('republishes every Portion that uses the product as an accompaniment, once and in order', async () => {
    const otherPortion = ProductFaker.fake({
      id: 'portion-2',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: otherPortion.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: otherPortion.id,
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'establishment-2',
          productId: 'foreign-portion',
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: product.id,
          accompanimentProductId: product.id,
        }),
      ],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({ product }),
        ProductSalesConfigurationSourceFaker.fake({ product: otherPortion }),
      ],
    )

    await update()

    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, product.id)
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [product.id, otherPortion.id])
    expect(scope.eventsRepository.add.mock.calls.map(([event]) => event.payload)).toEqual(
      [
        expect.objectContaining({ productId: product.id, state: 'available' }),
        expect.objectContaining({ productId: otherPortion.id, state: 'available' }),
      ],
    )
  })

  it('publishes nothing when the update is rejected', async () => {
    scope.productSizesRepository.findById.mockResolvedValue(undefined)

    await expect(update()).rejects.toBeInstanceOf(NotFoundError)

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })
})
