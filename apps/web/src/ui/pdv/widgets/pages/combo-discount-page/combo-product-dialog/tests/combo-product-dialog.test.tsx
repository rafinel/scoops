import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComboProductDialog } from '..'
import { useComboProductDialog } from '../use-combo-product-dialog'

import { portionProduct, resaleProduct } from '../../tests/combo-test-fixtures'

vi.mock('../use-combo-product-dialog', () => ({ useComboProductDialog: vi.fn() }))

function createView() {
  return {
    accompanimentIds: [],
    catalogError: null,
    configurationError: null,
    handleAdd: vi.fn(),
    handleDecreaseQuantity: vi.fn(),
    handleOpenChange: vi.fn(),
    handleIncreaseQuantity: vi.fn(),
    handleFilterChange: vi.fn(),
    handleSearchChange: vi.fn(),
    handleSelectBrand: vi.fn(),
    handleSelectSize: vi.fn(),
    handleSelectProduct: vi.fn(),
    isCatalogError: false,
    isLoadingCatalog: false,
    isValidConfiguration: false,
    kind: undefined,
    products: [portionProduct, resaleProduct],
    quantity: 1,
    search: '',
    selectedBrand: undefined,
    selectedProduct: undefined,
    selectedSize: undefined,
    subtotal: 0,
    toggleAccompaniment: vi.fn(),
  }
}

describe('ComboProductDialog', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useComboProductDialog).mockReturnValue(createView())
  })

  it('renders the selected filter as primary and inactive filters as outline', () => {
    render(
      <ComboProductDialog
        existingProductIds={[]}
        onAdd={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    )

    const todosButton = screen.getByRole('button', { name: 'Todos' })
    const portionsButton = screen.getByRole('button', { name: 'Porções' })
    const resaleButton = screen.getByRole('button', { name: 'Revendas' })

    expect(todosButton.getAttribute('aria-pressed')).toBe('true')
    expect(todosButton.className).toContain('bg-primary')
    expect(portionsButton.getAttribute('aria-pressed')).toBe('false')
    expect(portionsButton.className).toContain('border-border')
    expect(resaleButton.getAttribute('aria-pressed')).toBe('false')
    expect(resaleButton.className).toContain('border-border')
  })

  it('browses both Portion and Resale catalog states and delegates selection', () => {
    render(
      <ComboProductDialog
        existingProductIds={[]}
        onAdd={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    )
    expect(screen.getByRole('button', { name: /Açaí/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Brownie/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Porções' }))
    expect(
      vi.mocked(useComboProductDialog).mock.results[0].value.handleFilterChange,
    ).toHaveBeenCalledWith('portion')
    fireEvent.click(screen.getByRole('button', { name: /Açaí/ }))
    expect(
      vi.mocked(useComboProductDialog).mock.results[0].value.handleSelectProduct,
    ).toHaveBeenCalledWith(portionProduct)
  })

  it('renders and adds a single-stock resale with its default price', () => {
    const handleAdd = vi.fn()
    const view = {
      ...createView(),
      handleAdd,
      isValidConfiguration: true,
      quantity: 3,
      selectedProduct: resaleProduct,
      subtotal: 30,
    }
    vi.mocked(useComboProductDialog).mockReturnValue(view)

    render(
      <ComboProductDialog
        existingProductIds={[]}
        onAdd={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    )

    expect(screen.getByText('Sem marca: R$ 10,00')).toBeTruthy()
    expect(screen.getByText('R$ 30,00')).toBeTruthy()
    const addButton = screen.getByRole('button', { name: 'Adicionar produto' })
    expect(addButton).toHaveProperty('disabled', false)
    fireEvent.click(addButton)
    expect(handleAdd).toHaveBeenCalledOnce()
  })

  it('renders resale brands as single-choice checkboxes and delegates canonical brand ids', () => {
    const handleSelectBrand = vi.fn()
    const selectedProduct = {
      ...resaleProduct,
      resalePrice: 10,
      resaleBrands: [
        {
          brandId: 'brand-nutella',
          name: 'Nutella',
          basePrice: 75,
          isActive: true,
          isAvailable: true,
        },
        {
          brandId: 'brand-oats',
          name: 'Aveia',
          basePrice: 62.86,
          isActive: true,
          isAvailable: true,
        },
      ],
    }
    const view = {
      ...createView(),
      handleSelectBrand,
      selectedBrand: selectedProduct.resaleBrands[0],
      selectedProduct,
    }
    vi.mocked(useComboProductDialog).mockReturnValue(view)

    render(
      <ComboProductDialog
        existingProductIds={[]}
        onAdd={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    )

    const nutellaCheckbox = screen.getByRole('checkbox', { name: /Nutella/ })
    const aveiaCheckbox = screen.getByRole('checkbox', { name: /Aveia/ })

    expect(nutellaCheckbox.getAttribute('aria-checked')).toBe('true')
    expect(aveiaCheckbox.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(aveiaCheckbox)
    expect(handleSelectBrand).toHaveBeenCalledWith('brand-oats')
  })

  it('delegates accompaniment toggling to the owning hook', () => {
    const selectedProduct = {
      ...portionProduct,
      sizes: [
        {
          ...portionProduct.sizes[0],
          accompaniments: [
            {
              accompanimentId: 'accompaniment-1',
              basePrice: 2,
              isActive: true,
              isAvailable: true,
              name: 'Granola',
              quantityPerPortion: 1,
              type: 'Complemento',
            },
          ],
        },
      ],
    }
    const view = {
      ...createView(),
      accompanimentIds: ['accompaniment-1'],
      selectedProduct,
      selectedSize: selectedProduct.sizes[0],
    }
    vi.mocked(useComboProductDialog).mockReturnValue(view)

    render(
      <ComboProductDialog
        existingProductIds={[]}
        onAdd={vi.fn()}
        onOpenChange={vi.fn()}
        open
      />,
    )
    const granolaCheckbox = screen.getByRole('checkbox', { name: /Granola/ })

    expect(granolaCheckbox.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(granolaCheckbox)
    expect(view.toggleAccompaniment).toHaveBeenCalledTimes(1)
    expect(view.toggleAccompaniment).toHaveBeenCalledWith('accompaniment-1')
  })
})
