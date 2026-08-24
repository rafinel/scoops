import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProductPricingLoading } from '../index'

describe('ProductPricingLoading', () => {
  it('announces that pricing is loading', () => {
    render(<ProductPricingLoading />)

    const status = screen.getByRole('status', {
      name: 'Carregando preços do produto',
    })

    expect(status.getAttribute('aria-busy')).toBe('true')
  })
})
