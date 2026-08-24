import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilterPill } from '../index'

describe('FilterPill', () => {
  it('exposes active state and delegates toggling', () => {
    const onClick = vi.fn()
    render(
      <FilterPill active icon='package' onClick={onClick}>
        Ingrediente
      </FilterPill>,
    )

    const button = screen.getByRole('button', { name: 'Ingrediente' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
