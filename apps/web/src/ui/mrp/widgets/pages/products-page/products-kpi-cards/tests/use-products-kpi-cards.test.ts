import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useProductsKpiCards } from '../use-products-kpi-cards'

describe('useProductsKpiCards', () => {
  it('uses placeholders while loading and KPI values when ready', () => {
    const page = { kpis: { products: 8, brands: 3, lowStock: 1 } } as never
    const loading = renderHook(() => useProductsKpiCards(page, true))
    expect(loading.result.current.cards.map((card) => card.displayValue)).toEqual([
      '—',
      '—',
      '—',
    ])

    const ready = renderHook(() => useProductsKpiCards(page, false))
    expect(ready.result.current.cards.map((card) => card.displayValue)).toEqual([8, 3, 1])
  })
})
