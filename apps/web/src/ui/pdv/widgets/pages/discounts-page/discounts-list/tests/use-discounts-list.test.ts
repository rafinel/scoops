import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDiscountsList } from '../use-discounts-list'

describe('useDiscountsList', () => {
  it('derives the visible range from the pagination response', () => {
    const { result } = renderHook(() =>
      useDiscountsList({
        hasFilters: false,
        page: { items: [], page: 2, pageSize: 10, total: 25, totalPages: 3 },
      }),
    )
    expect(result.current).toMatchObject({
      firstItem: 11,
      lastItem: 20,
      pageNumber: 2,
      pageCount: 3,
      total: 25,
    })
  })
})
