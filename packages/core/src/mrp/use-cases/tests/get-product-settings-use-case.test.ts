import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { GetProductSettingsUseCase } from '#mrp/use-cases/get-product-settings-use-case.ts'

const product = ProductFaker.fake({ id: 'p1', establishmentId: 'e1', name: 'Milk' })
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Get Product Settings Use Case', () => {
  let productsRepository: MockProxy<ProductsRepository>
  let useCase: GetProductSettingsUseCase

  beforeEach(() => {
    productsRepository = mock<ProductsRepository>()
    productsRepository.findById.mockResolvedValue(product)
    useCase = new GetProductSettingsUseCase(productsRepository)
  })

  it('returns the complete owned product for a manager', async () => {
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).resolves.toEqual({
      product,
    })
    expect(productsRepository.findById).toHaveBeenCalledWith('e1', 'p1')
  })

  it('hides foreign and missing products and rejects operators', async () => {
    productsRepository.findById.mockResolvedValue({ ...product, establishmentId: 'e2' })
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).rejects.toBeInstanceOf(NotFoundError)

    productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor: manager, productId: product.id }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
