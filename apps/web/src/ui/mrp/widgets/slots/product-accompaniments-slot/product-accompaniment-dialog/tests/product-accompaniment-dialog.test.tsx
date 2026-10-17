import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
} from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductAccompanimentCandidate } from '@scoops/core/mrp/domain/structures'
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
const candidate: ProductAccompanimentCandidate = {
  productId: 'product-2',
  name: 'Granola',
  unit: 'g',
  stockControl: 'single',
  accompanimentPrice: 3,
  isGlobal: false,
  hasPortionLinks: false,
}
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const item = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.productId,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  brandName: 'Marca atual',
  salePrice: 3,
  estimatedCost: 0.45,
  isGlobal: false,
  hasOtherPortionLinks: false,
}

const createDialogFields = () => ({
  actionError: null,
  canSave: true,
  accompanimentPriceError: false,
  accompanimentPriceIsSaved: false,
  accompanimentPriceLoading: false,
  accompanimentPriceSuggestion: 3,
  accompanimentPriceSuggestionMode: 'resale-single',
  brandName: 'Marca atual',
  candidates: [candidate],
  candidatesError: false,
  candidatesLoading: false,
  estimatedCost: 0.45,
  handleGlobalChange: vi.fn(),
  handleValueChange: vi.fn(),
  isGlobalLocked: false,
  isGlobalValue: false,
  numericQuantity: 20,
  priceError: undefined,
  priceDescribedBy: 'accompaniment-price-help',
  productError: undefined,
  productIdValue: candidate.productId,
  quantityError: undefined,
  register: vi.fn((name: string) => ({
    name,
    defaultValue: name === 'accompanimentPrice' ? '3,00' : undefined,
  })),
  retryAccompanimentPrice: vi.fn(),
  retryCandidates: vi.fn(),
  retrySelectedStock: vi.fn(),
  selectedProductName: candidate.name,
  selectedProductUnit: candidate.unit,
  selectedStockError: false,
  selectedStockLoading: false,
  selectedTypeName: type.name,
  shouldShowReplacementNotice: false,
  sourceUnitCost: 0.45,
  typeError: undefined,
  typeId: type.id,
  types: [{ type, usageCount: 0 }],
  typesError: false,
  typesLoading: false,
})

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
  productIdValue: candidate.productId,
  retryCandidates: vi.fn(),
  retryAccompanimentPrice: vi.fn(),
  retrySelectedStock: vi.fn(),
  selectedProduct: candidate,
  selectedStockError: false,
  selectedStockLoading: false,
  fields: createDialogFields(),
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

    expect(screen.getByRole('dialog', { name: 'Vincular Acompanhamento' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Acompanhamento' })).toBeTruthy()
    const typeSelector = screen.getByRole('combobox', { name: 'Tipo' })
    expect(typeSelector.textContent).toContain(type.name)
    expect(typeSelector.textContent).not.toContain(type.id)
    expect((screen.getByLabelText('Marca atual') as HTMLInputElement).value).toBe(
      'Marca atual',
    )
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Preço do acompanhamento',
        }) as HTMLInputElement
      ).value,
    ).toBe('3,00')
    expect(
      screen
        .getByRole('textbox', { name: 'Preço do acompanhamento' })
        .getAttribute('aria-describedby'),
    ).toBe('accompaniment-price-help')
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
      fields: {
        ...createDialogFields(),
        accompanimentPriceIsSaved: true,
      },
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

    expect(screen.getByRole('dialog', { name: 'Editar Acompanhamento' })).toBeTruthy()
    expect(screen.getByDisplayValue('Granola').getAttribute('disabled')).not.toBeNull()
    expect(screen.getByText('Preço já configurado para este produto.')).toBeTruthy()
    expect(screen.queryByText(/Sugestão baseada/)).toBeNull()
  })

  it('reports background query refresh without replacing the form', () => {
    useProductAccompanimentDialogMock.mockReturnValue({
      ...createForm(),
      isRefreshing: true,
      fields: createDialogFields(),
    } as never)

    render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Vincular Acompanhamento' })
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
      fields: {
        ...createDialogFields(),
        accompanimentPriceError: true,
        canSave: false,
        retryAccompanimentPrice,
      },
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
      fields: { ...createDialogFields(), canSave: false },
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
      fields: {
        ...createDialogFields(),
        canSave: false,
        priceError: errorMessage,
        priceDescribedBy: 'accompaniment-price-help accompaniment-price-validation-error',
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
      accompanimentProductId: candidate.productId,
      accompanimentTypeId: type.id,
      quantityPerPortion: '0',
      accompanimentPrice: '3,00',
      isGlobal: false,
    })

    expect(result.success).toBe(false)
  })

  it('describes the Link and Edit purposes in the dialog header', () => {
    const { rerender } = render(
      <ProductAccompanimentDialog
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )
    expect(
      screen.getByRole('dialog', { name: 'Vincular Acompanhamento' }).textContent,
    ).toContain('Configure como este item aparece no PDV.')

    useProductAccompanimentDialogMock.mockReturnValue(createForm(true) as never)
    rerender(
      <ProductAccompanimentDialog
        item={item}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
      />,
    )
    expect(
      screen.getByRole('dialog', { name: 'Editar Acompanhamento' }).textContent,
    ).toContain('Atualize como este item aparece no PDV.')
  })

  describe('global availability', () => {
    function mockGlobalFields(overrides: Record<string, unknown>, isEdit = false) {
      useProductAccompanimentDialogMock.mockReturnValue({
        ...createForm(isEdit),
        fields: { ...createDialogFields(), ...overrides },
      } as never)
    }

    function renderDialog(withItem = false) {
      return render(
        <ProductAccompanimentDialog
          item={withItem ? item : undefined}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
          open
          productId='product-1'
        />,
      )
    }

    it('offers the enabled switch off with the shared-values help and no notices', () => {
      renderDialog()

      const globalSwitch = screen.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      expect(globalSwitch.getAttribute('aria-checked')).toBe('false')
      expect(globalSwitch.getAttribute('aria-disabled')).toBeNull()
      expect(globalSwitch.getAttribute('tabindex')).toBe('0')
      expect(
        screen.getByText(
          'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.',
        ).id,
      ).toBe(globalSwitch.getAttribute('aria-describedby'))
      expect(screen.queryByRole('status')).toBeNull()
    })

    it('toggles by mouse and by keyboard Space and reports the new value', () => {
      const handleGlobalChange = vi.fn()
      mockGlobalFields({ handleGlobalChange })
      renderDialog()
      const globalSwitch = screen.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })

      fireEvent.click(globalSwitch)
      globalSwitch.focus()
      fireEvent.keyDown(globalSwitch, { key: ' ' })
      fireEvent.keyUp(globalSwitch, { key: ' ' })

      expect(handleGlobalChange).toHaveBeenCalledTimes(2)
      expect(handleGlobalChange).toHaveBeenNthCalledWith(1, true)
      expect(handleGlobalChange).toHaveBeenNthCalledWith(2, true)
    })

    it('announces the global notice as a polite status at the top of the body', () => {
      mockGlobalFields({ isGlobalValue: true })
      renderDialog()

      const globalSwitch = screen.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      const notice = screen.getByRole('status')
      expect(globalSwitch.getAttribute('aria-checked')).toBe('true')
      expect(notice.textContent).toBe(
        'Acompanhamento global: as alterações valem para todas as porções.',
      )
      expect(
        notice.compareDocumentPosition(
          screen.getByRole('combobox', { name: 'Acompanhamento' }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('shows the replacement notice beside the switch and links it by description', () => {
      mockGlobalFields({ isGlobalValue: true, shouldShowReplacementNotice: true })
      renderDialog()

      const notice = screen.getByText(
        'Este acompanhamento já está vinculado individualmente a outras porções. Ao salvar, esses vínculos serão substituídos pela configuração global.',
      ).parentElement
      const globalSwitch = screen.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      expect(notice?.getAttribute('role')).toBe('status')
      expect(globalSwitch.getAttribute('aria-describedby')).toContain(notice?.id)
      expect(screen.getAllByRole('status')).toHaveLength(2)
    })

    it('hides the replacement notice when no individual links need replacing', () => {
      mockGlobalFields({ isGlobalValue: true, shouldShowReplacementNotice: false })
      renderDialog()

      expect(screen.queryByText(/vinculado individualmente a outras porções/)).toBeNull()
      expect(screen.getAllByRole('status')).toHaveLength(1)
    })

    it('locks a global accompaniment with an announced reason and 60% opacity', () => {
      const handleGlobalChange = vi.fn()
      mockGlobalFields(
        { handleGlobalChange, isGlobalLocked: true, isGlobalValue: true },
        true,
      )
      renderDialog(true)

      const globalSwitch = screen.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      const lockedHelp = screen.getByText(
        'Aparece em todas as porções, incluindo as novas. Para deixar de ser global, use Remover na tabela.',
      )
      expect(globalSwitch.getAttribute('aria-checked')).toBe('true')
      expect(globalSwitch.getAttribute('aria-disabled')).toBe('true')
      expect(globalSwitch.getAttribute('tabindex')).toBe('0')
      expect(globalSwitch.getAttribute('aria-describedby')).toBe(lockedHelp.id)
      expect(globalSwitch.closest('label')?.className).toContain('opacity-60')

      fireEvent.click(globalSwitch)
      fireEvent.keyDown(globalSwitch, { key: ' ' })
      fireEvent.keyUp(globalSwitch, { key: ' ' })

      expect(handleGlobalChange).not.toHaveBeenCalled()
      expect(globalSwitch.getAttribute('aria-checked')).toBe('true')
    })

    it('does not describe a locked switch with the replacement notice', () => {
      mockGlobalFields({ isGlobalLocked: true, isGlobalValue: true })
      renderDialog()

      expect(screen.queryByText(/vinculado individualmente a outras porções/)).toBeNull()
    })
  })
})
