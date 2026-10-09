import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ComboFaker } from '#pdv/domain/entities/fakers/combo-faker.ts'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import type { DiscountsRepository } from '#pdv/interfaces/discounts-repository.ts'
import type { OrderPreviewTokenService } from '#pdv/interfaces/order-preview-token-service.ts'
import type { SalesCatalogProvider } from '#pdv/interfaces/sales-catalog-provider.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import { PreviewOrderUseCase } from '#pdv/use-cases/preview-order-use-case.ts'

const request: OrderPreviewInput = {
  channelId: 'channel-1',
  lines: [{ productId: 'product-1', kind: 'resale', quantity: 2 }],
}

const product = {
  productId: 'product-1',
  name: 'Produto',
  kind: 'resale' as const,
  stockControl: ProductStockControl.Single,
  isActive: true,
  isAvailable: true,
  availableQuantity: 10,
  sizes: [],
  resalePrice: 10,
  resaleBrands: [],
}

const channel = {
  id: 'channel-1',
  establishmentId: 'establishment-1',
  name: 'Delivery',
  percentage: 10,
  status: SalesChannelStatus.Active,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('Preview Order Use Case', () => {
  let catalog: MockProxy<SalesCatalogProvider>
  let salesChannels: MockProxy<SalesChannelsRepository>
  let discounts: MockProxy<DiscountsRepository>
  let tokenService: MockProxy<OrderPreviewTokenService>
  let useCase: PreviewOrderUseCase

  beforeEach(() => {
    catalog = mock<SalesCatalogProvider>()
    salesChannels = mock<SalesChannelsRepository>()
    discounts = mock<DiscountsRepository>()
    tokenService = mock<OrderPreviewTokenService>()
    catalog.findByProductIds.mockResolvedValue([product])
    salesChannels.findById.mockResolvedValue(channel)
    discounts.findActive.mockResolvedValue([])
    tokenService.issue.mockReturnValue('opaque-preview-token')
    useCase = new PreviewOrderUseCase(catalog, salesChannels, discounts, tokenService)
  })

  it('rebuilds current facts and issues an opaque token without an idempotency key', async () => {
    const result = await useCase.execute({
      ...request,
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })

    expect(result).toMatchObject({
      previewToken: 'opaque-preview-token',
      cart: { total: 22 },
      channel: { channelId: 'channel-1', percentage: 10 },
    })
    expect(tokenService.issue).toHaveBeenCalledWith(
      request,
      'establishment-1',
      expect.objectContaining({ cart: expect.any(Object) }),
    )
    expect(tokenService.issue.mock.calls[0][0]).not.toHaveProperty('idempotencyKey')
  })

  it('prices separate portions of the same product with different accompaniments', async () => {
    catalog.findByProductIds.mockResolvedValue([
      {
        ...product,
        kind: 'portion',
        sizes: [
          {
            sizeId: 'size-1',
            name: '300 g',
            quantity: 300,
            basePrice: 21,
            isActive: true,
            isAvailable: true,
            accompaniments: [
              {
                accompanimentId: 'granola',
                productId: 'granola-product',
                name: 'Granola',
                type: 'Extra',
                quantityPerPortion: 0.03,
                basePrice: 2,
                isActive: true,
                isAvailable: true,
                availableQuantity: 100,
              },
            ],
          },
        ],
      },
    ])
    const result = await useCase.execute({
      lines: [
        {
          productId: product.productId,
          kind: 'portion',
          sizeId: 'size-1',
          quantity: 1,
          accompanimentIds: [],
        },
        {
          productId: product.productId,
          kind: 'portion',
          sizeId: 'size-1',
          quantity: 1,
          accompanimentIds: ['granola'],
        },
      ],
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })
    expect(result.cart.lines.map((line) => line.finalUnitPrice)).toEqual([21, 23])
    expect(result.cart.total).toBe(44)
    expect(result.previewToken).toBe('opaque-preview-token')
  })
  it('matches combos to the correct repeated-product configuration and combines identical-line capacity', async () => {
    catalog.findByProductIds.mockResolvedValue([
      product,
      {
        ...product,
        productId: 'portion-product',
        kind: 'portion',
        sizes: [
          {
            sizeId: 'size-1',
            name: '300 g',
            quantity: 300,
            basePrice: 21,
            isActive: true,
            isAvailable: true,
            accompaniments: [
              {
                accompanimentId: 'granola',
                productId: 'granola-product',
                name: 'Granola',
                type: 'Extra',
                quantityPerPortion: 1,
                basePrice: 2,
                isActive: true,
                isAvailable: true,
                availableQuantity: 100,
              },
            ],
          },
        ],
      },
    ])
    const combo = ComboFaker.fake({
      id: 'first-combo',
      fixedPrice: 40,
      components: [
        {
          productId: 'portion-product',
          kind: 'portion',
          sizeId: 'size-1',
          accompanimentIds: [],
          quantity: 2,
        },
        { productId: product.productId, kind: 'resale', quantity: 1 },
      ],
    })
    discounts.findActive.mockResolvedValue([
      combo,
      ComboFaker.fake({
        ...combo,
        id: 'second-combo',
        createdAt: new Date('2026-01-02'),
      }),
    ])
    const result = await useCase.execute({
      lines: [
        {
          productId: 'portion-product',
          kind: 'portion',
          sizeId: 'size-1',
          accompanimentIds: [],
          quantity: 1,
        },
        {
          productId: 'portion-product',
          kind: 'portion',
          sizeId: 'size-1',
          accompanimentIds: [],
          quantity: 1,
        },
        {
          productId: 'portion-product',
          kind: 'portion',
          sizeId: 'size-1',
          accompanimentIds: ['granola'],
          quantity: 1,
        },
        { productId: product.productId, kind: 'resale', quantity: 2 },
      ],
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })
    expect(result.cart.discounts.map((discount) => discount.discountId)).toEqual([
      'first-combo',
    ])
    expect(result.cart.subtotal).toBe(85)
    expect(result.cart.totalDiscount).toBe(12)
    expect(result.cart.total).toBe(73)
  })
})
