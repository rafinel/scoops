import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductSizesEmptyState } from '../index'

describe('ProductSizesEmptyState', () => {
  it('explains the empty state and delegates the first-size action', () => {
    const onAdd = vi.fn()

    render(<ProductSizesEmptyState onAdd={onAdd} />)

    expect(
      screen.getByRole('heading', { name: 'Nenhum tamanho cadastrado' }),
    ).toBeTruthy()
    const addButton = screen.getByRole('button', { name: 'Adicionar primeiro tamanho' })
    fireEvent.click(addButton)

    expect(onAdd).toHaveBeenCalledWith(addButton)
  })
})
