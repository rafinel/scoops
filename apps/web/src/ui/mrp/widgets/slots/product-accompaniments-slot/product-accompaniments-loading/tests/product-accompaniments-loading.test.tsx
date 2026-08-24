import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProductAccompanimentsLoading } from '../index'

describe('ProductAccompanimentsLoading', () => {
  it('announces that accompaniments are loading', () => {
    render(<ProductAccompanimentsLoading />)

    const status = screen.getByRole('status', { name: 'Carregando acompanhamentos' })
    expect(status.getAttribute('aria-busy')).toBe('true')
  })
})
