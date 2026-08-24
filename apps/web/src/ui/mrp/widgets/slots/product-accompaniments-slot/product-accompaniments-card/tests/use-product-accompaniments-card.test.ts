import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useProductAccompanimentsCard } from '../use-product-accompaniments-card'

describe('useProductAccompanimentsCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps the card controller contract empty until card behavior is introduced', () => {
    const { result } = renderHook(() => useProductAccompanimentsCard())

    expect(result.current).toBeNull()
  })
})
