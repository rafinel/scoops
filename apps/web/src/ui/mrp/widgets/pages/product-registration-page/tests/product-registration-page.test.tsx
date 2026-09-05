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
    isPending: false,
    name: 'Polpa',
    register: vi.fn(() => ({ name: 'field' })) as never,
    stockControl: 'by-brand',
    unit: 'un',
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
    expect(screen.getByRole('heading', { name: 'Controle de estoque' })).not.toBeNull()
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
