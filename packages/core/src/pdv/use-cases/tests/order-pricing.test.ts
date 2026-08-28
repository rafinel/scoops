import { describe, expect, it } from 'vitest'

import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ComboFaker } from '#pdv/domain/entities/fakers/index.ts'
import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { OrderPreviewInput } from '#pdv/domain/structures/order-preview.ts'
import { allocateCombos, rebuildCart } from '#pdv/use-cases/order-pricing.ts'

const input: OrderPreviewInput = {
  lines: [
    {
      productId: 'portion-1',
      kind: 'portion',
      quantity: 2,
      sizeId: 'size-1',
      accompanimentIds: ['accompaniment-1'],
    },
    { productId: 'resale-1', kind: 'resale', quantity: 1, brandId: 'brand-1' },
  ],
}

const products = [
  {
    productId: 'portion-1',
    name: 'Porção',
    kind: 'portion' as const,
    stockControl: ProductStockControl.Single,
    isActive: true,
    isAvailable: true,
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
    resaleBrands: [],
  },
  {
    productId: 'resale-1',
    name: 'Revenda',
    kind: 'resale' as const,
    stockControl: ProductStockControl.ByBrand,
    isActive: true,
    isAvailable: true,
    availableQuantity: 10,
    sizes: [],
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
]

function cartWith(lines: Cart['lines']): Cart {
  return {
    establishmentId: 'establishment-1',
    lines,
    discounts: [],
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
  }
}

describe('Order Pricing', () => {
  it('rounds unit and line calculations and applies a channel to rebuilt prices', () => {
    const cart = rebuildCart(input, products, {
      id: 'channel-1',
      establishmentId: 'establishment-1',
      name: 'Delivery',
      percentage: 10,
      status: 'active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    })

    expect(cart.lines[0]).toMatchObject({
      baseUnitPrice: 10.01,
      finalUnitPrice: 11.01,
      subtotal: 22.02,
    })
    expect(cart.lines[0].consumptions[1]).toMatchObject({
      productId: 'accompaniment-product-1',
      accompanimentId: 'accompaniment-1',
    })
    expect(cart.total).toBe(33.02)
  })

  it('chooses the maximum non-overlapping saving and only applies each Combo once', () => {
    const lineA = {
      productId: 'a',
      kind: 'resale' as const,
      quantity: 1,
      accompanimentIds: [],
      baseUnitPrice: 10,
      finalUnitPrice: 10,
      subtotal: 10,
      consumptions: [{ productId: 'a', quantity: 1 }],
    }
    const lineB = {
      ...lineA,
      productId: 'b',
      consumptions: [{ productId: 'b', quantity: 1 }],
    }
    const lineC = {
      ...lineA,
      productId: 'c',
      consumptions: [{ productId: 'c', quantity: 1 }],
    }
    const cart = cartWith([lineA, lineB, lineC])
    const first = ComboFaker.fake({
      id: 'combo-a-b',
      fixedPrice: 10,
      createdAt: new Date('2026-01-01'),
      components: [
        { kind: 'resale', productId: 'a', quantity: 1 },
        { kind: 'resale', productId: 'b', quantity: 1 },
      ],
    })
    const second = ComboFaker.fake({
      id: 'combo-a-c',
      fixedPrice: 10,
      createdAt: new Date('2026-01-02'),
      components: [
        { kind: 'resale', productId: 'a', quantity: 1 },
        { kind: 'resale', productId: 'c', quantity: 1 },
      ],
    })
    const repeated = ComboFaker.fake({
      id: 'combo-a-b-again',
      fixedPrice: 10,
      createdAt: new Date('2026-01-03'),
      components: [
        { kind: 'resale', productId: 'a', quantity: 1 },
        { kind: 'resale', productId: 'b', quantity: 1 },
      ],
    })

    const discounts = allocateCombos(cart, [second, repeated, first])

    expect(discounts).toHaveLength(1)
    expect(discounts[0]).toMatchObject({ discountId: 'combo-a-b', savings: 10 })
  })
})
