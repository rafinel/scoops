import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductPricingError } from '../index'

describe('ProductPricingError', () => {
  it('exposes the failure message and delegates retry', () => {
    const onRetry = vi.fn()

    render(<ProductPricingError onRetry={onRetry} />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar os preços',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
