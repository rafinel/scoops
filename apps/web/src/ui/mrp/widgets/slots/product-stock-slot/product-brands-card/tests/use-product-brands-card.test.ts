import { renderHook } from '@testing-library/react'
import { BrandFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import { describe, expect, it } from 'vitest'

import { useProductBrandsCard } from '../use-product-brands-card'

describe('useProductBrandsCard', () => {
  function fakeBrandStock(
    overrides: {
      brand?: Parameters<typeof BrandFaker.fake>[0]
      stockQuantity?: number
      unitPrice?: number
    } = {},
  ): ProductBrandStock {
    return {
      brand: BrandFaker.fake({
        id: 'brand-1',
        name: 'Marca principal',
        productId: 'product-1',
        ...overrides.brand,
      }),
      stockQuantity: overrides.stockQuantity ?? 10,
      unitPrice: overrides.unitPrice ?? 4,
    }
  }

  it('formats brand prices and quantities for each brand unit in pt-BR', () => {
    const { result } = renderHook(() =>
      useProductBrandsCard(
        [
          fakeBrandStock({
            brand: { packagePrice: 12.5, packageQuantity: 1.5, unit: 'g' },
            stockQuantity: 250.25,
            unitPrice: 0.05,
          }),
          fakeBrandStock({
            brand: {
              id: 'brand-2',
              packagePrice: 8.75,
              packageQuantity: 2,
              unit: undefined,
            },
            stockQuantity: 3.125,
            unitPrice: 4.375,
          }),
        ],
        'kg',
      ),
    )

    expect(result.current.rows).toEqual([
      expect.objectContaining({
        formattedPackagePrice: 'R$\u00a012,50',
        formattedPackageQuantity: '1,5 g',
        formattedStockQuantity: '250,25 kg',
        formattedUnitPrice: 'R$\u00a00,05 / g',
      }),
      expect.objectContaining({
        formattedPackagePrice: 'R$\u00a08,75',
        formattedPackageQuantity: '2 kg',
        formattedStockQuantity: '3,125 kg',
        formattedUnitPrice: 'R$\u00a04,38 / kg',
      }),
    ])
  })
})
