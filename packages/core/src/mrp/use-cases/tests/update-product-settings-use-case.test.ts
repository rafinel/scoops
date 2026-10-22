import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import { UpdateProductSettingsUseCase } from '#mrp/use-cases/update-product-settings-use-case.ts'

const updatedAt = new Date('2026-01-01T00:00:00.000Z')
const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  updatedAt,
})
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Update Product Settings Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let eventsRepository: MockProxy<EventsRepository>
  let useCase: UpdateProductSettingsUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    eventsRepository = mock<EventsRepository>()
    scope.eventsRepository = eventsRepository
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productsRepository.replace.mockResolvedValue({ ...product, updatedAt })
    scope.productsRepository.findByName.mockResolvedValue(undefined)
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product })],
    )
    useCase = new UpdateProductSettingsUseCase(database)
  })

  it('persists simple changes and explicit null clears, then records events in the transaction', async () => {
    const result = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: {
        name: '  Oat Milk  ',
        idealStock: null,
        internalNotes: null,
        expectedUpdatedAt: updatedAt,
      },
    })

    expect(scope.productsRepository.replace).toHaveBeenCalledWith('e1', 'p1', {
      name: 'Oat Milk',
      idealStock: null,
      internalNotes: null,
    })
    expect(database.run).toHaveBeenCalledTimes(1)
    expect(eventsRepository.add).toHaveBeenCalledTimes(2)
    expect(result.product.id).toBe('p1')
  })

  it('rejects invalid, duplicate, stale, foreign, and non-manager requests without writes', async () => {
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { idealStock: 1.0001, expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()

    scope.productsRepository.findByName.mockResolvedValue({ ...product, id: 'other' })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { name: 'Other', expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    scope.productsRepository.findByName.mockResolvedValue(undefined)
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { status: 'inactive', expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      establishmentId: 'e2',
    })
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { status: 'inactive', expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toThrow('Produto não encontrado.')

    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        input: { status: 'inactive', expectedUpdatedAt: updatedAt },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('republishes the product and its inverse owners before recording the product update', async () => {
    const owner = ProductFaker.fake({ id: 'portion-1', establishmentId: 'e1' })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: owner.id,
          accompanimentProductId: product.id,
        }),
      ],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({ product }),
        ProductSalesConfigurationSourceFaker.fake({ product: owner }),
      ],
    )

    await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { status: 'inactive', expectedUpdatedAt: updatedAt },
    })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', [product.id, owner.id])
    expect(eventsRepository.add.mock.calls.map(([event]) => event)).toEqual([
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({ productId: product.id, state: 'available' }),
      }),
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({ productId: owner.id, state: 'available' }),
      }),
      expect.objectContaining({ name: ProductUpdatedEvent._NAME }),
    ])
  })

  const update = (
    input: Record<string, unknown> = {},
    overrides: { profile?: UserProfile } = {},
  ) =>
    useCase.execute({
      actor: { ...manager, ...overrides },
      productId: product.id,
      input: { expectedUpdatedAt: updatedAt, ...input } as never,
    })
  const savedChanges = () =>
    (scope.productsRepository.replace.mock.calls[0] as unknown[] | undefined)?.[2] as
      | Record<string, unknown>
      | undefined

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    await expect(
      update({ status: 'inactive' }, { profile: UserProfile.Operator }),
    ).rejects.toThrow(
      new AuthorizationError('Somente gestores podem alterar as configurações.'),
    )

    expect(database.run).not.toHaveBeenCalled()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('requires at least one setting to change', async () => {
    await expect(update()).rejects.toThrow(
      new BadRequestError('Informe pelo menos uma configuração para alterar.'),
    )

    expect(database.run).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    ['not a date', 'yesterday'],
    ['an invalid date', new Date(Number.NaN)],
  ])('rejects an expected version that is %s', async (_label, expectedUpdatedAt) => {
    await expect(update({ status: 'inactive', expectedUpdatedAt })).rejects.toThrow(
      new BadRequestError('A versão do produto é inválida.'),
    )

    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['blank', '   ', 'O nome do produto é obrigatório.'],
    [
      'over 120 characters',
      'a'.repeat(121),
      'O nome do produto deve ter no máximo 120 caracteres.',
    ],
    [
      'over 120 characters once trimmed',
      ` ${'a'.repeat(121)} `,
      'O nome do produto deve ter no máximo 120 caracteres.',
    ],
  ])('rejects a %s name with its message', async (_label, name, message) => {
    await expect(update({ name })).rejects.toThrow(new BadRequestError(message))

    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts a name with exactly 120 characters after trimming', async () => {
    const name = 'a'.repeat(120)

    await update({ name: ` ${name} ` })

    expect(savedChanges()).toStrictEqual({ name })
  })

  it.each([-0.001, Number.NaN, Number.POSITIVE_INFINITY, 1.0001, 12.3456])(
    'rejects the ideal stock %s with the ideal-stock message',
    async (idealStock) => {
      await expect(update({ idealStock })).rejects.toThrow(
        new BadRequestError(
          'O estoque ideal deve ser não negativo e ter até três casas decimais.',
        ),
      )

      expect(database.run).not.toHaveBeenCalled()
    },
  )

  it.each([0, 2.5, 1234.567, 1_000_000])(
    'accepts the ideal stock %s',
    async (idealStock) => {
      await update({ idealStock })

      expect(savedChanges()).toStrictEqual({ idealStock })
    },
  )

  it('rejects an unknown status with the status message', async () => {
    await expect(update({ status: 'archived' })).rejects.toThrow(
      new BadRequestError('O status do produto é inválido.'),
    )

    expect(database.run).not.toHaveBeenCalled()
  })

  it.each(['active', 'inactive'])('accepts the %s status', async (status) => {
    await update({ status })

    expect(savedChanges()).toStrictEqual({ status })
  })

  it.each(['yes', 1, null])(
    'rejects the negative-stock policy %s with the policy message',
    async (allowNegativeStock) => {
      await expect(update({ allowNegativeStock })).rejects.toThrow(
        new BadRequestError('A política de estoque negativo é inválida.'),
      )

      expect(database.run).not.toHaveBeenCalled()
    },
  )

  it.each([true, false])(
    'persists the negative-stock policy %s',
    async (allowNegativeStock) => {
      await update({ allowNegativeStock })

      expect(savedChanges()).toStrictEqual({ allowNegativeStock })
    },
  )

  it('trims notes, keeps explicit nulls and limits notes to 2000 characters after trimming', async () => {
    await update({ internalNotes: '  remember  ' })
    expect(savedChanges()).toStrictEqual({ internalNotes: 'remember' })

    scope.productsRepository.replace.mockClear()
    await update({ internalNotes: null })
    expect(savedChanges()).toStrictEqual({ internalNotes: null })

    scope.productsRepository.replace.mockClear()
    const limit = 'n'.repeat(2000)
    await update({ internalNotes: `  ${limit}  ` })
    expect(savedChanges()).toStrictEqual({ internalNotes: limit })

    await expect(update({ internalNotes: `${limit}n` })).rejects.toThrow(
      new BadRequestError('As observações devem ter no máximo 2000 caracteres.'),
    )
  })

  it('sends only the informed settings to the repository', async () => {
    await update({
      name: 'Oat',
      idealStock: 3,
      status: 'inactive',
      allowNegativeStock: true,
      internalNotes: 'note',
    })

    expect(scope.productsRepository.replace).toHaveBeenCalledExactlyOnceWith('e1', 'p1', {
      name: 'Oat',
      idealStock: 3,
      status: 'inactive',
      allowNegativeStock: true,
      internalNotes: 'note',
    })
    expect(Object.keys(savedChanges() ?? {}).sort()).toEqual([
      'allowNegativeStock',
      'idealStock',
      'internalNotes',
      'name',
      'status',
    ])
  })

  it('looks the duplicate name up only when the name changes', async () => {
    await update({ name: 'Milk' })
    await update({ status: 'inactive' })

    expect(scope.productsRepository.findByName).not.toHaveBeenCalled()

    await update({ name: '  Oat  ' })

    expect(scope.productsRepository.findByName).toHaveBeenCalledExactlyOnceWith(
      'e1',
      'Oat',
    )
  })

  it('reports a name used by another product with the duplicate message and writes nothing', async () => {
    scope.productsRepository.findByName.mockResolvedValue({ ...product, id: 'other' })

    await expect(update({ name: 'Oat' })).rejects.toThrow(
      new ConflictError('Já existe um produto com esse nome neste estabelecimento.'),
    )

    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('allows a name that only resolves to the product itself', async () => {
    scope.productsRepository.findByName.mockResolvedValue(product)

    await update({ name: 'Oat' })

    expect(scope.productsRepository.replace).toHaveBeenCalledExactlyOnceWith('e1', 'p1', {
      name: 'Oat',
    })
  })

  it('reports a stale version with its message and writes nothing', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    })

    await expect(update({ status: 'inactive' })).rejects.toThrow(
      new ConflictError(
        'As configurações do produto foram alteradas. Recarregue e tente novamente.',
      ),
    )

    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('records the product update event with the saved product facts after the configurations', async () => {
    const savedAt = new Date('2026-03-04T05:06:07.000Z')
    scope.productsRepository.replace.mockResolvedValue({
      ...product,
      id: 'saved-id',
      establishmentId: 'saved-establishment',
      updatedAt: savedAt,
    })

    await update({ status: 'inactive' })

    expect(eventsRepository.add.mock.calls.at(-1)?.[0]).toEqual(
      new ProductUpdatedEvent({
        productId: 'saved-id',
        establishmentId: 'saved-establishment',
        updatedAt: savedAt,
      }),
    )
    expect(eventsRepository.add).toHaveBeenCalledTimes(2)
  })

  it('republishes only same-tenant inverse owners, once, ahead of nothing else', async () => {
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: 'portion-1',
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: 'portion-1',
          accompanimentProductId: product.id,
        }),
        ProductAccompanimentFaker.fake({
          establishmentId: 'e2',
          productId: 'foreign-portion',
          accompanimentProductId: product.id,
        }),
      ],
    )

    await update({ status: 'inactive' })

    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledExactlyOnceWith('e1', product.id)
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', [product.id, 'portion-1'])
  })

  it('writes the settings before publishing anything', async () => {
    await update({ status: 'inactive' })

    expect(scope.productsRepository.replace.mock.invocationCallOrder[0]).toBeLessThan(
      eventsRepository.add.mock.invocationCallOrder[0],
    )
  })
})
