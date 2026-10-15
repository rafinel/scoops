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
import { BadRequestError } from '#shared/domain/errors/index.ts'
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

  it('rejects invalid cart input before loading facts or issuing a token', async () => {
    const portionWithoutSize = {
      lines: [{ productId: 'portion-1', kind: 'portion', quantity: 1 }],
    } as unknown as OrderPreviewInput
    const invalidInputs: OrderPreviewInput[] = [
      { lines: [] },
      {
        lines: Array.from({ length: 51 }, (_, index) => ({
          productId: `product-${index}`,
          kind: 'resale' as const,
          quantity: 1,
        })),
      },
      { lines: [{ productId: 'resale-1', kind: 'resale', quantity: 0 }] },
      { lines: [{ productId: 'resale-1', kind: 'resale', quantity: 1000 }] },
      { lines: [{ productId: 'resale-1', kind: 'resale', quantity: 1.5 }] },
      portionWithoutSize,
      {
        lines: [
          {
            productId: 'portion-1',
            kind: 'portion',
            quantity: 1,
            sizeId: 'size-1',
            accompanimentIds: ['syrup-1', 'syrup-1'],
          },
        ],
      },
      {
        lines: [
          {
            productId: 'resale-1',
            kind: 'resale',
            quantity: 1,
            accompanimentIds: ['syrup-1'],
          },
        ],
      },
    ]

    for (const input of invalidInputs) {
      await expect(
        useCase.execute({
          ...input,
          actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }

    expect(catalog.findByProductIds).not.toHaveBeenCalled()
    expect(salesChannels.findById).not.toHaveBeenCalled()
    expect(discounts.findActive).not.toHaveBeenCalled()
    expect(tokenService.issue).not.toHaveBeenCalled()
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
    expect(tokenService.issue.mock.calls[0][2]).toMatchObject({
      selectedAccompanimentPrices: [
        {
          productId: product.productId,
          sizeId: 'size-1',
          accompanimentId: 'granola',
          name: 'Granola',
          basePrice: 2,
        },
      ],
    })
    expect(result).not.toHaveProperty('selectedAccompanimentPrices')
  })

  it('signs each selected accompaniment price once in stable order', async () => {
    const portionA = {
      ...product,
      productId: 'portion-a',
      kind: 'portion' as const,
      sizes: [
        {
          sizeId: 'size-a',
          name: 'Pequeno',
          quantity: 300,
          basePrice: 10,
          isActive: true,
          isAvailable: true,
          accompaniments: [
            {
              accompanimentId: 'syrup-b',
              productId: 'syrup-b-product',
              name: 'Calda B',
              type: 'Extra',
              quantityPerPortion: 1,
              basePrice: 2,
              isActive: true,
              isAvailable: true,
              availableQuantity: 10,
            },
            {
              accompanimentId: 'syrup-a',
              productId: 'syrup-a-product',
              name: 'Calda A',
              type: 'Extra',
              quantityPerPortion: 1,
              basePrice: 1,
              isActive: true,
              isAvailable: true,
              availableQuantity: 10,
            },
          ],
        },
      ],
    }
    const portionB = {
      ...product,
      productId: 'portion-b',
      kind: 'portion' as const,
      sizes: [
        {
          sizeId: 'size-b',
          name: 'Grande',
          quantity: 500,
          basePrice: 20,
          isActive: true,
          isAvailable: true,
          accompaniments: [
            {
              accompanimentId: 'syrup-b',
              productId: 'syrup-b-product',
              name: 'Calda B',
              type: 'Extra',
              quantityPerPortion: 1,
              basePrice: 3,
              isActive: true,
              isAvailable: true,
              availableQuantity: 10,
            },
          ],
        },
      ],
    }
    catalog.findByProductIds.mockResolvedValue([portionB, portionA])

    await useCase.execute({
      lines: [
        {
          productId: 'portion-b',
          kind: 'portion',
          quantity: 1,
          sizeId: 'size-b',
          accompanimentIds: ['syrup-b'],
        },
        {
          productId: 'portion-a',
          kind: 'portion',
          quantity: 1,
          sizeId: 'size-a',
          accompanimentIds: ['syrup-b', 'syrup-a'],
        },
        {
          productId: 'portion-a',
          kind: 'portion',
          quantity: 1,
          sizeId: 'size-a',
          accompanimentIds: ['syrup-b', 'syrup-a'],
        },
      ],
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })

    expect(tokenService.issue.mock.calls[0][2]).toMatchObject({
      selectedAccompanimentPrices: [
        {
          productId: 'portion-a',
          sizeId: 'size-a',
          accompanimentId: 'syrup-a',
          name: 'Calda A',
          basePrice: 1,
        },
        {
          productId: 'portion-a',
          sizeId: 'size-a',
          accompanimentId: 'syrup-b',
          name: 'Calda B',
          basePrice: 2,
        },
        {
          productId: 'portion-b',
          sizeId: 'size-b',
          accompanimentId: 'syrup-b',
          name: 'Calda B',
          basePrice: 3,
        },
      ],
    })
  })

  it('rejects unavailable product configuration through the preview use case', async () => {
    catalog.findByProductIds.mockResolvedValue([])

    await expect(
      useCase.execute({
        lines: [{ productId: 'removed-product', kind: 'resale', quantity: 1 }],
        actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(tokenService.issue).not.toHaveBeenCalled()
  })

  it('rounds channel-adjusted line prices and accompaniment consumption through the preview use case', async () => {
    catalog.findByProductIds.mockResolvedValue([
      {
        ...product,
        kind: 'portion',
        sizes: [
          {
            sizeId: 'size-1',
            name: 'Grande',
            quantity: 1,
            basePrice: 10.005,
            isActive: true,
            isAvailable: true,
            accompaniments: [
              {
                accompanimentId: 'accompaniment-1',
                productId: 'accompaniment-product-1',
                name: 'Calda',
                type: 'Extra',
                quantityPerPortion: 1,
                basePrice: 0.005,
                isActive: true,
                isAvailable: true,
                availableQuantity: 10,
              },
            ],
          },
        ],
      },
      {
        ...product,
        productId: 'resale-1',
        stockControl: ProductStockControl.ByBrand,
        resaleBrands: [
          {
            brandId: 'brand-1',
            name: 'Marca',
            basePrice: 10,
            isActive: true,
            isAvailable: true,
            availableQuantity: 10,
          },
        ],
      },
    ])

    const result = await useCase.execute({
      lines: [
        {
          productId: 'product-1',
          kind: 'portion',
          quantity: 2,
          sizeId: 'size-1',
          accompanimentIds: ['accompaniment-1'],
        },
        { productId: 'resale-1', kind: 'resale', quantity: 1, brandId: 'brand-1' },
      ],
      channelId: 'channel-1',
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })

    expect(result.cart.lines.map((line) => line.subtotal)).toEqual([22.02, 11])
    expect(result.cart.lines[0].baseUnitPrice).toBe(10.01)
    expect(result.cart.lines[0].consumptions[1]).toMatchObject({
      productId: 'accompaniment-product-1',
      accompanimentId: 'accompaniment-1',
      quantity: 2,
    })
    expect(result.cart.total).toBe(33.02)
  })

  it('selects the greatest non-overlapping Combo saving once through the preview use case', async () => {
    catalog.findByProductIds.mockResolvedValue(
      ['a', 'b', 'c'].map((productId) => ({ ...product, productId })),
    )
    const first = ComboFaker.fake({
      id: 'combo-a-b',
      fixedPrice: 12,
      createdAt: new Date('2026-01-01'),
      components: [
        { kind: 'resale', productId: 'a', quantity: 1 },
        { kind: 'resale', productId: 'b', quantity: 1 },
      ],
    })
    const alternative = ComboFaker.fake({
      id: 'combo-a-c',
      fixedPrice: 11,
      createdAt: new Date('2026-01-02'),
      components: [
        { kind: 'resale', productId: 'a', quantity: 1 },
        { kind: 'resale', productId: 'c', quantity: 1 },
      ],
    })
    const duplicate = ComboFaker.fake({
      id: 'combo-a-b-again',
      fixedPrice: 12.5,
      createdAt: new Date('2026-01-03'),
      components: first.components,
    })
    discounts.findActive.mockResolvedValue([alternative, duplicate, first])

    const result = await useCase.execute({
      lines: ['a', 'b', 'c'].map((productId) => ({
        productId,
        kind: 'resale' as const,
        quantity: 1,
      })),
      actor: { establishmentId: 'establishment-1', profile: UserProfile.Operator },
    })

    expect(result.cart.discounts).toMatchObject([{ discountId: 'combo-a-c', savings: 9 }])
    expect(result.cart.total).toBe(21)
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
