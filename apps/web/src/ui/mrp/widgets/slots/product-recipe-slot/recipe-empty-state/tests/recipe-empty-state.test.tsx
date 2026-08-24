import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RecipeEmptyState } from '../index'

describe('RecipeEmptyState', () => {
  afterEach(cleanup)

  it('keeps adding disabled when the recipe cannot be edited', () => {
    render(<RecipeEmptyState canAdd={false} onAdd={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Comece a montar sua receita' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Adicionar primeiro ingrediente' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('delegates adding when enabled', () => {
    const onAdd = vi.fn()
    render(<RecipeEmptyState canAdd onAdd={onAdd} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Adicionar primeiro ingrediente' }),
    )
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
