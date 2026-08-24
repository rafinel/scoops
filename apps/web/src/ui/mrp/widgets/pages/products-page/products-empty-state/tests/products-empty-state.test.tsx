import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductsEmptyState } from '../index'
import { useProductsEmptyState } from '../use-products-empty-state'

vi.mock('../use-products-empty-state', () => ({ useProductsEmptyState: vi.fn() }))
const useProductsEmptyStateMock = vi.mocked(useProductsEmptyState)

describe('ProductsEmptyState', () => {
  afterEach(cleanup)

  beforeEach(() => vi.clearAllMocks())

  it('renders the filtered empty state with a clear action', () => {
    const onClear = vi.fn()
    useProductsEmptyStateMock.mockReturnValue({
      title: 'Nenhum produto encontrado',
      description: 'Tente ajustar os filtros.',
    })
    render(<ProductsEmptyState hasFilters onClear={onClear} />)

    expect(
      screen.getByRole('heading', { name: 'Nenhum produto encontrado' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('hides the clear action when the catalog has no filters', () => {
    useProductsEmptyStateMock.mockReturnValue({
      title: 'Seu catálogo está vazio',
      description: 'Cadastre seu primeiro produto.',
    })
    render(<ProductsEmptyState hasFilters={false} onClear={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Seu catálogo está vazio' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull()
  })
})
