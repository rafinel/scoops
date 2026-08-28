import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewSaleCatalog } from '..'
import { useNewSaleCatalog } from '../use-new-sale-catalog'

vi.mock('../use-new-sale-catalog', () => ({ useNewSaleCatalog: vi.fn() }))

const useNewSaleCatalogMock = vi.mocked(useNewSaleCatalog)
const product = {
  productId: 'product-1',
  name: 'Morango especial',
  kind: 'portion' as const,
  stockControl: 'single' as const,
  isActive: true,
  isAvailable: true,
  sizes: [
    {
      sizeId: 'size-1',
      name: 'Médio',
      quantity: 1,
      basePrice: 18,
      isActive: true,
      isAvailable: true,
      accompaniments: [],
    },
  ],
  resaleBrands: [],
}

describe('NewSaleCatalog', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders accessible filters and delegates product selection', () => {
    const onSelectProduct = vi.fn()
    const handleKindChange = vi.fn()
    const handleSearchChange = vi.fn()
    useNewSaleCatalogMock.mockReturnValue({
      catalogError: undefined,
      catalogPage: { items: [product], page: 1, pageSize: 20, total: 1, totalPages: 1 },
      handleClearFilters: vi.fn(),
      handleKindChange,
      handlePageChange: vi.fn(),
      handleSearchChange,
      handleSelectProduct: onSelectProduct,
      isCatalogError: false,
      isLoadingCatalog: false,
      kind: undefined,
      page: 1,
      refetchCatalog: vi.fn(),
      search: '',
    } as never)

    render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar produto por nome' }), {
      target: { value: 'morango' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Porções' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Morango especial' }))

    expect(handleSearchChange).toHaveBeenCalledWith('morango')
    expect(handleKindChange).toHaveBeenCalledWith('portion')
    expect(onSelectProduct).toHaveBeenCalledWith(product)
  })

  it('renders loading and recovery states', () => {
    const refetchCatalog = vi.fn()
    useNewSaleCatalogMock.mockReturnValue({
      catalogError: undefined,
      catalogPage: undefined,
      handleClearFilters: vi.fn(),
      handleKindChange: vi.fn(),
      handlePageChange: vi.fn(),
      handleSearchChange: vi.fn(),
      handleSelectProduct: vi.fn(),
      isCatalogError: true,
      isLoadingCatalog: true,
      kind: undefined,
      page: 1,
      refetchCatalog,
      search: '',
    } as never)

    render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)

    expect(
      screen.getByRole('status', { name: 'Carregando produtos' }).children,
    ).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetchCatalog).toHaveBeenCalledOnce()
  })
})
