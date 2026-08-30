import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useOrdersList } from '../use-orders-list'

describe('useOrdersList', () => {
  it('formats order dates and totals using shared pt-BR formatters', () => {
    const { result } = renderHook(() => useOrdersList())
    expect(result.current.formatOrderTotal(42.56).replace(/\u00a0/g, ' ')).toBe(
      'R$ 42,56',
    )
    expect(
      result.current.formatOrderDate(new Date('2026-07-25T16:24:00-03:00')),
    ).toContain('25/07/2026')
  })
})
