import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
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
})
