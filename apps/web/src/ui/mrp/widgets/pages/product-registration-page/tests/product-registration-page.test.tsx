import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ProductRegistrationPage } from '..'
import { useProductRegistrationPage } from '../use-product-registration-page'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../use-product-registration-page', () => ({
  useProductRegistrationPage: vi.fn(),
}))

const useProductRegistrationPageMock = vi.mocked(useProductRegistrationPage)

function createState(
  overrides: Partial<ReturnType<typeof useProductRegistrationPage>> = {},
): ReturnType<typeof useProductRegistrationPage> {
  const brand = {
    id: 'brand-1',
    name: 'Frooty',
    unit: 'kg' as const,
    packageQuantity: '2',
    packagePrice: '12,50',
    packageCount: '3',
    isPrimary: true,
  }
  return {
    accompanimentPrice: '',
    allowNegativeStock: false,
    brandErrors: [
      {
        name: undefined,
        packageCount: undefined,
        packagePrice: undefined,
        packageQuantity: undefined,
      },
    ],
    brands: [brand],
    calculatedInitialStock: 6,
    categories: [ProductCategory.Ingredient],
    currentUnitCost: '',
    fieldErrors: {},
    formError: null,
    idealStock: '10',
    initialStock: '0',
    isAccompanimentPriceVisible: false,
    isPending: false,
    isResalePriceVisible: false,
    isSizesSectionVisible: false,
    name: 'Polpa',
    register: vi.fn(() => ({ name: 'field' })) as never,
    resalePrice: '',
    sizeFields: {
      onAddSize: vi.fn(),
      onRemoveSize: vi.fn(),
      onSizeChange: vi.fn(),
      sizeErrors: [{}],
      sizes: [{ id: 'size-0', name: '', quantity: '', price: '' }],
      unit: 'un',
    },
    stockControl: 'by-brand',
    unit: 'un',
    handleAccompanimentPriceChange: vi.fn(),
    handleAddBrand: vi.fn(),
    handleAllowNegativeStockChange: vi.fn(),
    handleBrandChange: vi.fn(),
    handleCancel: vi.fn(),
    handleCurrentUnitCostChange: vi.fn(),
    handleIdealStockChange: vi.fn(),
    handleInitialStockChange: vi.fn(),
    handleNameChange: vi.fn(),
    handlePrimaryBrandChange: vi.fn(),
    handleProductCategoryToggle: vi.fn(),
    handleRegister: vi.fn() as never,
    handleRemoveBrand: vi.fn(),
    handleResalePriceChange: vi.fn(),
    handleStockControlChange: vi.fn(),
    handleUnitChange: vi.fn(),
    isCategoryDisabled: vi.fn(() => false),
    ...overrides,
  }
}

describe('ProductRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductRegistrationPageMock.mockReturnValue(createState())
  })

  afterEach(cleanup)

  it('renders the single-stock composition and submits through the page hook', () => {
    const state = createState({
      brands: [],
      categories: [ProductCategory.Ingredient],
      initialStock: '4',
      idealStock: '10',
      name: 'Polpa',
      stockControl: 'single',
    })
    useProductRegistrationPageMock.mockReturnValue(state)

    render(<ProductRegistrationPage />)

    expect(screen.getByRole('heading', { name: 'Novo produto' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Estoque' })).not.toBeNull()
    expect(
      (screen.getByRole('textbox', { name: 'Nome' }) as HTMLInputElement).value,
    ).toBe('Polpa')
    expect(
      (screen.getByRole('spinbutton', { name: 'Estoque inicial' }) as HTMLInputElement)
        .value,
    ).toBe('4')
    expect(
      (screen.getByRole('spinbutton', { name: 'Estoque ideal' }) as HTMLInputElement)
        .value,
    ).toBe('10')
    expect(
      screen.getByRole('spinbutton', { name: /Custo unitário atual/ }),
    ).not.toBeNull()
    expect(screen.queryByRole('radio', { name: 'Marca principal 1' })).toBeNull()
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Criar produto' })
        .closest('form') as HTMLFormElement,
    )
    expect(state.handleRegister).toHaveBeenCalledOnce()
  })

  it('delegates product category and single-stock control interactions', () => {
    const state = createState({
      categories: [ProductCategory.Ingredient],
      currentUnitCost: '2,50',
      initialStock: '4',
      idealStock: '10',
      stockControl: 'single',
    })
    useProductRegistrationPageMock.mockReturnValue(state)
    render(<ProductRegistrationPage />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: 'Açaí' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Revenda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Estoque único' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Permitir estoque negativo' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Estoque inicial' }), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Estoque ideal' }), {
      target: { value: '12' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: /Custo unitário atual/ }), {
      target: { value: '3.50' },
    })

    expect(state.handleNameChange).toHaveBeenCalledWith('Açaí')
    expect(state.handleProductCategoryToggle).toHaveBeenCalledWith(ProductCategory.Resale)
    expect(state.handleStockControlChange).toHaveBeenCalledWith('single')
    expect(state.handleAllowNegativeStockChange).toHaveBeenCalledWith(true)
    expect(state.handleInitialStockChange).toHaveBeenCalledWith('5')
    expect(state.handleIdealStockChange).toHaveBeenCalledWith('12')
    expect(state.handleCurrentUnitCostChange).toHaveBeenCalledWith('3.50')
  })

  it('renders by-brand controls and delegates brand interactions', () => {
    const baseState = createState()
    const firstBrand = baseState.brands[0]
    const state = createState({
      brandErrors: [
        {
          name: undefined,
          packageCount: undefined,
          packagePrice: undefined,
          packageQuantity: undefined,
        },
        {
          name: undefined,
          packageCount: undefined,
          packagePrice: undefined,
          packageQuantity: undefined,
        },
      ],
      brands: [
        firstBrand,
        {
          ...firstBrand,
          id: 'brand-2',
          isPrimary: false,
          name: 'Frutamil',
        },
      ],
      calculatedInitialStock: 8,
      stockControl: 'by-brand',
    })
    useProductRegistrationPageMock.mockReturnValue(state)
    render(<ProductRegistrationPage />)

    expect(
      screen.getByText('Total calculado pelas quantidades iniciais das marcas.'),
    ).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Por marca' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.queryByRole('spinbutton', { name: /Custo unitário atual/ })).toBeNull()
    expect(
      (
        screen.getByRole('textbox', {
          name: /Estoque inicial Total calculado pelas quantidades iniciais das marcas/,
        }) as HTMLInputElement
      ).value,
    ).toBe('8')

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Nome da marca' })[0], {
      target: { value: 'Açaí Brasil' },
    })
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Qtd. por embalagem' })[0], {
      target: { value: '2,5' },
    })
    fireEvent.change(screen.getAllByRole('textbox', { name: /Valor por embalagem/ })[0], {
      target: { value: '12,00' },
    })
    fireEvent.change(
      screen.getAllByRole('textbox', { name: 'Quantidade inicial de pacotes' })[0],
      { target: { value: '4' } },
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Marca principal 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover marca 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar outra marca' }))

    expect(state.handleBrandChange).toHaveBeenNthCalledWith(1, 'brand-1', {
      name: 'Açaí Brasil',
    })
    expect(state.handleBrandChange).toHaveBeenNthCalledWith(2, 'brand-1', {
      packageQuantity: '2,5',
    })
    expect(state.handleBrandChange).toHaveBeenNthCalledWith(3, 'brand-1', {
      packagePrice: '12,00',
    })
    expect(state.handleBrandChange).toHaveBeenNthCalledWith(4, 'brand-1', {
      packageCount: '4',
    })
    expect(state.handlePrimaryBrandChange).toHaveBeenCalledWith('brand-2')
    expect(state.handleRemoveBrand).toHaveBeenCalledWith('brand-1')
    expect(state.handleAddBrand).toHaveBeenCalledOnce()
  })

  describe('sizes', () => {
    const sizeFields = {
      onAddSize: vi.fn(),
      onRemoveSize: vi.fn(),
      onSizeChange: vi.fn(),
      sizeErrors: [
        { name: undefined, quantity: 'Quantidade inválida', price: undefined },
        {},
      ],
      sizes: [
        { id: 'size-0', name: 'Pequeno', quantity: '0', price: '9,90' },
        { id: 'size-1', name: 'Grande', quantity: '0,5', price: '14,50' },
      ],
      unit: 'kg' as const,
    }
    const portionState = {
      categories: [ProductCategory.Portion],
      isSizesSectionVisible: true,
      sizeFields,
      stockControl: 'single' as const,
      unit: 'kg' as const,
    }

    it('renders no sizes section while the hook reports it hidden', () => {
      render(<ProductRegistrationPage />)

      expect(screen.queryByRole('heading', { name: 'Tamanhos e preços' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Adicionar tamanho' })).toBeNull()
    })

    it('renders the section between the Catálogo and Estoque cards with the typed rows', () => {
      useProductRegistrationPageMock.mockReturnValue(createState(portionState))
      render(<ProductRegistrationPage />)

      const sizes = screen.getByRole('heading', { name: 'Tamanhos e preços' })
      const catalog = screen.getByRole('heading', { name: 'Catálogo' })
      const stock = screen.getByRole('heading', { name: 'Estoque' })
      expect(
        catalog.compareDocumentPosition(sizes) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(
        sizes.compareDocumentPosition(stock) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(
        (screen.getByRole('textbox', { name: 'Nome do tamanho 1' }) as HTMLInputElement)
          .value,
      ).toBe('Pequeno')
      expect(
        (screen.getByRole('textbox', { name: 'Nome do tamanho 2' }) as HTMLInputElement)
          .value,
      ).toBe('Grande')
      expect(screen.getByText('Quantidade inválida')).not.toBeNull()
    })

    it('delegates size changes, additions and removals to the page hook', () => {
      const state = createState(portionState)
      useProductRegistrationPageMock.mockReturnValue(state)
      render(<ProductRegistrationPage />)

      fireEvent.change(screen.getByRole('textbox', { name: 'Nome do tamanho 1' }), {
        target: { value: 'Mini' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Quantidade do tamanho 2' }), {
        target: { value: '1' },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'Preço do tamanho 2' }), {
        target: { value: '20,00' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Remover tamanho 1' }))
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar tamanho' }))

      expect(state.sizeFields.onSizeChange).toHaveBeenNthCalledWith(1, 'size-0', {
        name: 'Mini',
      })
      expect(state.sizeFields.onSizeChange).toHaveBeenNthCalledWith(2, 'size-1', {
        quantity: '1',
      })
      expect(state.sizeFields.onSizeChange).toHaveBeenNthCalledWith(3, 'size-1', {
        price: '20,00',
      })
      expect(state.sizeFields.onRemoveSize).toHaveBeenCalledWith('size-0')
      expect(state.sizeFields.onAddSize).toHaveBeenCalledOnce()
    })
  })

  describe('sale prices', () => {
    it('renders no price field for a product that cannot receive a sale price', () => {
      useProductRegistrationPageMock.mockReturnValue(
        createState({ categories: [ProductCategory.Ingredient], stockControl: 'single' }),
      )
      render(<ProductRegistrationPage />)

      expect(screen.queryByRole('textbox', { name: 'Preço de revenda' })).toBeNull()
      expect(
        screen.queryByRole('textbox', { name: 'Preço como acompanhamento' }),
      ).toBeNull()
    })

    it('renders the typed prices and delegates their changes to the page hook', () => {
      const state = createState({
        accompanimentPrice: '9',
        brands: [],
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
        isAccompanimentPriceVisible: true,
        isResalePriceVisible: true,
        resalePrice: '12,00',
        stockControl: 'single',
      })
      useProductRegistrationPageMock.mockReturnValue(state)
      render(<ProductRegistrationPage />)

      const resalePrice = screen.getByRole('textbox', {
        name: 'Preço de revenda',
      }) as HTMLInputElement
      const accompanimentPrice = screen.getByRole('textbox', {
        name: 'Preço como acompanhamento',
      }) as HTMLInputElement
      expect(resalePrice.value).toBe('12,00')
      expect(accompanimentPrice.value).toBe('9')

      fireEvent.change(resalePrice, { target: { value: '15,50' } })
      fireEvent.change(accompanimentPrice, { target: { value: '0' } })

      expect(state.handleResalePriceChange).toHaveBeenCalledExactlyOnceWith('15,50')
      expect(state.handleAccompanimentPriceChange).toHaveBeenCalledExactlyOnceWith('0')
    })

    it('shows only the visible price field and passes its validation error through', () => {
      useProductRegistrationPageMock.mockReturnValue(
        createState({
          brands: [],
          categories: [ProductCategory.Accompaniment],
          fieldErrors: {
            accompanimentPrice:
              'Informe um preço maior ou igual a zero, com até duas casas decimais.',
          },
          isAccompanimentPriceVisible: true,
          stockControl: 'single',
        }),
      )
      render(<ProductRegistrationPage />)

      expect(screen.queryByRole('textbox', { name: 'Preço de revenda' })).toBeNull()
      const accompanimentPrice = screen.getByRole('textbox', {
        name: 'Preço como acompanhamento',
      })
      expect(accompanimentPrice.getAttribute('aria-invalid')).toBe('true')
      expect(
        screen.getByText(
          'Informe um preço maior ou igual a zero, com até duas casas decimais.',
        ),
      ).toBeDefined()
    })

    it('keeps typed prices and shows the page-level alert after a server rejection', () => {
      useProductRegistrationPageMock.mockReturnValue(
        createState({
          brands: [],
          categories: [ProductCategory.Resale],
          formError:
            'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
          isResalePriceVisible: true,
          resalePrice: '12,00',
          stockControl: 'single',
        }),
      )
      render(<ProductRegistrationPage />)

      expect(screen.getByRole('alert').textContent).toContain(
        'O preço de revenda é permitido apenas',
      )
      expect(
        (screen.getByRole('textbox', { name: 'Preço de revenda' }) as HTMLInputElement)
          .value,
      ).toBe('12,00')
    })
  })

  it('disables cancellation and submission while product creation is pending', () => {
    useProductRegistrationPageMock.mockReturnValue(createState({ isPending: true }))
    render(<ProductRegistrationPage />)

    expect(
      (screen.getByRole('button', { name: 'Criando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('keeps actionable error state and exposes cancel/back navigation', () => {
    const handleCancel = vi.fn()
    useProductRegistrationPageMock.mockReturnValue(
      createState({ formError: 'Produto duplicado', handleCancel }),
    )
    render(<ProductRegistrationPage />)

    expect(screen.getByRole('alert').textContent).toContain('Produto duplicado')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(handleCancel).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('link', { name: 'Voltar para produtos' }).getAttribute('href'),
    ).toBe(ROUTES.products)
  })
})
