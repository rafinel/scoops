import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AccompanimentsEmptyState } from '../index'

describe('AccompanimentsEmptyState', () => {
  it('explains the empty state and delegates the linking action', () => {
    const onAdd = vi.fn()

    render(<AccompanimentsEmptyState onAdd={onAdd} />)

    expect(
      screen.getByRole('heading', { name: 'Nenhum acompanhamento vinculado' })
        .textContent,
    ).toBe('Nenhum acompanhamento vinculado')
    const addButton = screen.getByRole('button', {
      name: 'Vincular acompanhamento',
    })
    fireEvent.click(addButton)

    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
