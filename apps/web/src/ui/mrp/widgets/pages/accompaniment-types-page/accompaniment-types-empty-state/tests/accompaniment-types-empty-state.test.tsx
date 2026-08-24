import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AccompanimentTypesEmptyState } from '../index'

describe('AccompanimentTypesEmptyState', () => {
  it('offers creating the first accompaniment type', () => {
    const onAdd = vi.fn()
    render(<AccompanimentTypesEmptyState onAdd={onAdd} />)

    expect(screen.getByRole('heading', { name: 'Nenhum tipo cadastrado' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Novo tipo' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
