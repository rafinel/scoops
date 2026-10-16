import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '@scoops/core/mrp/domain/entities/fakers'
import { productAccompanimentFormSchema } from '@scoops/validation'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { ProductAccompanimentDialog } from '../index'
import { useProductAccompanimentDialog } from '../use-product-accompaniment-dialog'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route: _route, ...props }: AnchorProps) => (
    <a href={ROUTES[_route]} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('../use-product-accompaniment-dialog', () => ({
  useProductAccompanimentDialog: vi.fn(),
}))

const useProductAccompanimentDialogMock = vi.mocked(useProductAccompanimentDialog)
const candidate = ProductFaker.fake({ id: 'product-2', name: 'Granola', unit: 'g' })
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const item = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  brandName: 'Marca atual',
  salePrice: 3,
  estimatedCost: 0.45,
}

const createForm = (isEdit = false) => ({
  actionError: null,
  accompanimentPriceError: false,
  accompanimentPriceIsSaved: false,
  accompanimentPriceLoading: false,
  accompanimentPriceSuggestion: 3,
  accompanimentPriceSuggestionMode: 'resale-single',
  canSave: true,
  candidates: [candidate],
  candidatesError: false,
  candidatesLoading: false,
  errors: {},
  estimatedCost: 0.45,
  handleSubmit: vi.fn((event: { preventDefault: () => void }) => event.preventDefault()),
  handleValueChange: vi.fn(),
  isEdit,
  isPending: false,
  productIdValue: candidate.id,
  retryCandidates: vi.fn(),
  retryAccompanimentPrice: vi.fn(),
  retrySelectedStock: vi.fn(),
  selectedProduct: candidate,
  selectedStockError: false,
  selectedStockLoading: false,
  source: { name: 'Marca atual', unitCost: 0.45 },
  selectedTypeName: type.name,
  typeId: type.id,
  types: [{ type, usageCount: 0 }],
  typesError: false,
  typesLoading: false,
  register: vi.fn((name: string) => ({
    name,
    defaultValue: name === 'accompanimentPrice' ? '3,00' : undefined,
  })),
})

describe('ProductAccompanimentDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductAccompanimentDialogMock.mockReturnValue(createForm() as never)
  })

  it('renders the linking form with candidate, type and stock context', () => {
    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Vincular acompanhamento' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Acompanhamento' })).toBeTruthy()
    const typeSelector = screen.getByRole('combobox', { name: 'Tipo' })
    expect(typeSelector.textContent).toContain(type.name)
    expect(typeSelector.textContent).not.toContain(type.id)
    expect(screen.getByLabelText('Marca atual').getAttribute('value')).toBe('Marca atual')
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Preço do acompanhamento',
        }) as HTMLInputElement
      ).value,
    ).toBe('3,00')
    expect(screen.getByText(/vale para todos os vínculos e tamanhos/)).toBeTruthy()
    expect(screen.getByText(/Sugestão baseada no preço de revenda único/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Gerenciar tipos →' }).textContent).toContain(
      'Gerenciar tipos',
    )
  })

  it('renders the edit mode with the linked product locked', () => {
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(true),
      accompanimentPriceIsSaved: true,
    } as never)

    render(
      <ProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Editar acompanhamento' })).toBeTruthy()
    expect(screen.getByDisplayValue('Granola').getAttribute('disabled')).not.toBeNull()
    expect(screen.getByText('Preço já configurado para este produto.')).toBeTruthy()
    expect(screen.queryByText(/Sugestão baseada/)).toBeNull()
  })

  it('reports background query refresh without replacing the form', () => {
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(),
      isRefreshing: true,
    } as never)

    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Vincular acompanhamento' })
    const status = screen.getByRole('status', { name: 'Atualizando…' })
    expect(status.textContent).toBe('Atualizando…')
    const form = dialog.querySelector('form')
    expect(dialog.children[0]?.contains(status)).toBe(true)
    expect(form).toBe(dialog.children[1])
    expect(
      screen
        .getByRole('combobox', { name: 'Acompanhamento' })
        .getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('shows price read failures with a retry and blocks a save on unresolved data', () => {
    const retryAccompanimentPrice = vi.fn()
    const onOpenChange = vi.fn()
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(),
      accompanimentPriceError: true,
      canSave: false,
      retryAccompanimentPrice,
    } as never)

    render(
      <ProductAccompanimentDialog
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' })
    expect(
      screen.getByText('Não foi possível carregar o preço do acompanhamento.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Vincular' }).hasAttribute('disabled'),
    ).toBe(true)
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    expect(cancelButton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(cancelButton)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    fireEvent.click(retryButton)
    expect(retryAccompanimentPrice).toHaveBeenCalledTimes(1)
  })

  it('disables Save while cached pricing is being refreshed', () => {
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(),
      canSave: false,
      isRefreshing: true,
    } as never)

    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Vincular' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('associates the price validation error with its field', () => {
    const errorMessage = 'Informe um preço válido.'
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(),
      canSave: false,
      errors: {
        accompanimentPrice: { message: errorMessage, type: 'custom' },
      },
    } as never)

    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    const priceField = screen.getByRole('textbox', {
      name: 'Preço do acompanhamento',
    })
    expect(priceField.getAttribute('aria-invalid')).toBe('true')
    expect(priceField.getAttribute('aria-describedby')).toContain(
      'accompaniment-price-validation-error',
    )
    expect(screen.getByText(errorMessage).getAttribute('id')).toBe(
      'accompaniment-price-validation-error',
    )
  })

  it('keeps the quantity contract strict for submitted links', () => {
    const result = productAccompanimentFormSchema.safeParse({
      accompanimentProductId: candidate.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: '0',
    })

    expect(result.success).toBe(false)
  })
})
