import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SalesCatalogListItem } from '@scoops/core/pdv/domain/structures'
import { SalesCatalogProductFaker } from '@scoops/core/pdv/domain/structures/fakers'

import { NewSaleCatalog } from '..'
import { useNewSaleCatalog, type NewSaleCatalogCard } from '../use-new-sale-catalog'

vi.mock('../use-new-sale-catalog', () => ({ useNewSaleCatalog: vi.fn() }))

const useNewSaleCatalogMock = vi.mocked(useNewSaleCatalog)
const product: SalesCatalogListItem = SalesCatalogProductFaker.fakeListItem({
  productId: 'product-1',
  name: 'Morango especial',
  kind: 'portion',
  resalePrice: undefined,
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
})

function createCard(overrides: Partial<NewSaleCatalogCard> = {}): NewSaleCatalogCard {
  const cardProduct = overrides.product ?? product
  const isAdded = overrides.isAdded ?? false

  return {
    actionAriaLabel: `${isAdded ? 'Adicionar outra configuração de' : 'Adicionar'} ${cardProduct.name}`,
    actionLabel: isAdded ? 'Adicionar outra porção' : 'Adicionar',
    availabilityPillId: `new-sale-availability-${cardProduct.productId}`,
    description: 'Escolha o tamanho e os acompanhamentos',
    isAdded,
    kindLabel: 'Porção',
    priceLabel: 'A partir de R$ 18,00',
    product: cardProduct,
    ...overrides,
  }
}

function createView(cards: NewSaleCatalogCard[], overrides = {}) {
  return {
    catalogCards: cards,
    catalogError: undefined,
    catalogPage: {
      items: cards.map((card) => card.product),
      page: 1,
      pageSize: 20,
      total: cards.length,
      totalPages: 1,
    },
    countLabel: `${cards.length} produtos elegíveis · 0 adicionados`,
    handleClearFilters: vi.fn(),
    handleKindChange: vi.fn(),
    handlePageChange: vi.fn(),
    handleSearchChange: vi.fn(),
    handleSelectProduct: vi.fn(),
    hasSearch: false,
    isCatalogError: false,
    isLoadingCatalog: false,
    isPageLoadingCatalog: false,
    isRefreshingCatalog: false,
    kind: undefined,
    page: 1,
    refetchCatalog: vi.fn(),
    search: '',
    ...overrides,
  }
}

const outOfStockProduct: SalesCatalogListItem = {
  ...product,
  productId: 'product-out',
  name: 'Pote de açaí 1 L',
  kind: 'resale',
  availability: 'out_of_stock',
  isAvailable: false,
  resalePrice: 28,
  sizes: [],
}

const missingPriceProduct: SalesCatalogListItem = {
  ...outOfStockProduct,
  productId: 'product-unpriced',
  name: 'Pote de açaí 500 ml',
  availability: 'missing_price',
  resalePrice: undefined,
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
    useNewSaleCatalogMock.mockReturnValue(
      createView([createCard()], {
        handleKindChange,
        handleSearchChange,
        handleSelectProduct: onSelectProduct,
      }) as never,
    )

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
    useNewSaleCatalogMock.mockReturnValue(
      createView([], {
        catalogCards: [],
        catalogPage: undefined,
        countLabel: 'Selecione um produto para começar',
        isCatalogError: true,
        isLoadingCatalog: true,
        refetchCatalog,
      }) as never,
    )

    render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)

    expect(
      screen.getByRole('status', { name: 'Carregando produtos' }).children,
    ).toHaveLength(4)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetchCatalog).toHaveBeenCalledOnce()
  })

  it('allows adding the same portion product again after it is already in the order', () => {
    const handleSelectProduct = vi.fn()
    useNewSaleCatalogMock.mockReturnValue(
      createView([createCard({ isAdded: true })], { handleSelectProduct }) as never,
    )

    render(
      <NewSaleCatalog
        addedProductIds={[product.productId]}
        onSelectProduct={handleSelectProduct}
      />,
    )

    const addButton = screen.getByRole('button', {
      name: 'Adicionar outra configuração de Morango especial',
    })
    expect(addButton.hasAttribute('disabled')).toBe(false)
    expect(addButton.textContent).toBe('Adicionar outra porção')
    fireEvent.click(addButton)
    expect(handleSelectProduct).toHaveBeenCalledWith(product)
  })

  it('shows the count copy provided by the owning hook', () => {
    useNewSaleCatalogMock.mockReturnValue(
      createView([createCard()], {
        countLabel: '3 produtos encontrados · 2 adicionados',
      }) as never,
    )

    render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)

    expect(screen.getByText('3 produtos encontrados · 2 adicionados')).toBeTruthy()
    expect(screen.queryByText(/elegíveis/)).toBeNull()

    cleanup()
    useNewSaleCatalogMock.mockReturnValue(
      createView([createCard()], {
        countLabel: '3 produtos elegíveis · 2 adicionados',
      }) as never,
    )
    render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)

    expect(screen.getByText('3 produtos elegíveis · 2 adicionados')).toBeTruthy()
  })

  describe('unavailable cards', () => {
    function renderSearchedCatalog(handleSelectProduct = vi.fn()) {
      useNewSaleCatalogMock.mockReturnValue(
        createView(
          [
            createCard(),
            createCard({
              priceLabel: 'R$ 28,00',
              product: outOfStockProduct,
              unavailableReason: 'out_of_stock',
            }),
            createCard({
              priceLabel: 'Preço não definido',
              product: missingPriceProduct,
              unavailableReason: 'missing_price',
            }),
          ],
          {
            countLabel: '3 produtos encontrados · 2 adicionados',
            handleSelectProduct,
            hasSearch: true,
            search: 'açaí',
          },
        ) as never,
      )
      render(<NewSaleCatalog addedProductIds={[]} onSelectProduct={vi.fn()} />)
    }

    it('renders reason pills with icons, price lines and no consultation copy', () => {
      renderSearchedCatalog()

      const outOfStockPill = screen.getByText('Sem estoque')
      const missingPricePill = screen.getByText('Sem preço')

      expect(outOfStockPill.querySelector('svg.lucide-circle-off')).not.toBeNull()
      expect(
        missingPricePill.querySelector('svg.lucide-circle-dollar-sign'),
      ).not.toBeNull()
      expect(screen.getByText('R$ 28,00')).toBeTruthy()
      expect(screen.getByText('Preço não definido')).toBeTruthy()
      expect(screen.queryByText('Preço sob consulta')).toBeNull()
      expect(screen.getAllByText('Disponível')).toHaveLength(1)
    })

    it('exposes disabled Adicionar buttons with aria-disabled and the reason as description', () => {
      renderSearchedCatalog()

      const outOfStockButton = screen.getByRole('button', {
        name: 'Adicionar Pote de açaí 1 L',
      })
      const missingPriceButton = screen.getByRole('button', {
        name: 'Adicionar Pote de açaí 500 ml',
      })
      const availableButton = screen.getByRole('button', {
        name: 'Adicionar Morango especial',
      })

      expect(outOfStockButton.getAttribute('aria-disabled')).toBe('true')
      expect(outOfStockButton.hasAttribute('disabled')).toBe(false)
      expect(missingPriceButton.getAttribute('aria-disabled')).toBe('true')
      expect(missingPriceButton.hasAttribute('disabled')).toBe(false)
      expect(availableButton.hasAttribute('aria-disabled')).toBe(false)
      expect(availableButton.hasAttribute('aria-describedby')).toBe(false)
      expect(
        document.getElementById(outOfStockButton.getAttribute('aria-describedby') ?? '')
          ?.textContent,
      ).toBe('Sem estoque')
      expect(
        document.getElementById(missingPriceButton.getAttribute('aria-describedby') ?? '')
          ?.textContent,
      ).toBe('Sem preço')
    })

    it('keeps disabled buttons focusable and delegates activation to the guarded handler', () => {
      const handleSelectProduct = vi.fn()
      renderSearchedCatalog(handleSelectProduct)
      const missingPriceButton = screen.getByRole('button', {
        name: 'Adicionar Pote de açaí 500 ml',
      })

      missingPriceButton.focus()
      fireEvent.click(missingPriceButton)

      expect(document.activeElement).toBe(missingPriceButton)
      expect(missingPriceButton.tabIndex).toBe(0)
      expect(handleSelectProduct).toHaveBeenCalledWith(missingPriceProduct)
    })

    it('shows the unavailable pill instead of Adicionado when an added product is unavailable', () => {
      useNewSaleCatalogMock.mockReturnValue(
        createView([
          createCard({
            isAdded: true,
            priceLabel: 'R$ 28,00',
            product: outOfStockProduct,
            unavailableReason: 'out_of_stock',
          }),
        ]) as never,
      )

      render(
        <NewSaleCatalog
          addedProductIds={[outOfStockProduct.productId]}
          onSelectProduct={vi.fn()}
        />,
      )

      expect(screen.getByText('Sem estoque')).toBeTruthy()
      expect(screen.queryByText('Adicionado')).toBeNull()
      expect(screen.queryByText('Disponível')).toBeNull()
    })
  })
})
