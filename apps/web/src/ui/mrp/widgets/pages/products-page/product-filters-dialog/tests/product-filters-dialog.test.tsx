import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFiltersDialog } from '../index'
import { useProductFiltersDialog } from '../use-product-filters-dialog'

vi.mock('../use-product-filters-dialog', () => ({ useProductFiltersDialog: vi.fn() }))

const useProductFiltersDialogMock = vi.mocked(useProductFiltersDialog)

describe('ProductFiltersDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductFiltersDialogMock.mockReturnValue({
      draftCategories: [ProductCategory.Ingredient],
      draftStatus: 'active',
      draftStockSituation: 'low',
      filterGroupCount: 3,
      handleApply: vi.fn(),
      handleCategoryToggle: vi.fn(),
      handleClear: vi.fn(),
      handleStatusToggle: vi.fn(),
      handleStockSituationToggle: vi.fn(),
    })
  })

  it('renders filter groups and delegates apply and clear actions', () => {
    const onOpenChange = vi.fn()
    render(
      <ProductFiltersDialog
        isOpen
        onOpenChange={onOpenChange}
        onSearchChange={vi.fn()}
        search={{
          search: '',
          categories: [],
          sortBy: 'name',
          sortDirection: 'asc',
          page: 1,
        }}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Filtrar produtos' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Categoria' })).toBeTruthy()
    expect(screen.getByText(/3 grupos de filtros/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Limpar/ }))
    fireEvent.click(screen.getByRole('button', { name: /Aplicar filtros/ }))
    expect(
      useProductFiltersDialogMock.mock.results[0].value.handleClear,
    ).toHaveBeenCalledTimes(1)
    expect(
      useProductFiltersDialogMock.mock.results[0].value.handleApply,
    ).toHaveBeenCalledTimes(1)
  })
})
