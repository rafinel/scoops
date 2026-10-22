import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { LinkPortionsDialog } from '../index'
import { useLinkPortionsDialog } from '../use-link-portions-dialog'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../use-link-portions-dialog', () => ({ useLinkPortionsDialog: vi.fn() }))

const useLinkPortionsDialogMock = vi.mocked(useLinkPortionsDialog)

const candidates = [
  { productId: 'a', name: 'Açaí 300 ml', status: 'active' as const },
  { productId: 'b', name: 'Sorvete de coco', status: 'inactive' as const },
]
const type = { id: 'type-1', name: 'Cobertura' }

function createState(
  overrides: Record<string, unknown> = {},
): ReturnType<typeof useLinkPortionsDialog> {
  return {
    accompanimentName: 'Granola',
    accompanimentPriceError: false,
    accompanimentPriceIsSaved: false,
    accompanimentPriceLoading: false,
    accompanimentPriceSuggestion: 3,
    accompanimentPriceSuggestionMode: 'resale-single',
    actionError: null,
    brandName: 'Mãe Terra',
    candidates,
    candidatesError: false,
    candidatesLoading: false,
    canSubmit: true,
    errors: {},
    estimatedCost: 0.45,
    isPending: false,
    isRefreshing: false,
    numericQuantity: 50,
    portionProductIds: [],
    priceDescribedBy: 'accompaniment-price-help',
    priceRegistration: { name: 'accompanimentPrice', defaultValue: '3,00' },
    quantityRegistration: { name: 'quantityPerPortion' },
    selectedStockError: false,
    selectedStockLoading: false,
    selectedTypeName: type.name,
    sourceUnitCost: 0.00899,
    submitLabel: 'Vincular porções',
    typeId: type.id,
    types: [{ type, usageCount: 0 }],
    typesError: false,
    typesLoading: false,
    unit: 'g',
    handleSelectedIdsChange: vi.fn(),
    handleSubmit: vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    ),
    handleTypeChange: vi.fn(),
    retryAccompanimentPrice: vi.fn(),
    retryCandidates: vi.fn(),
    retrySelectedStock: vi.fn(),
    ...overrides,
  } as never
}

const onBecameGlobalMock = vi.fn()

function renderDialog(onOpenChange = vi.fn()) {
  return render(
    <LinkPortionsDialog
      onBecameGlobal={onBecameGlobalMock}
      onOpenChange={onOpenChange}
      onSuccess={vi.fn()}
      open
      productId='accompaniment-1'
    />,
  )
}

describe('LinkPortionsDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useLinkPortionsDialogMock.mockReturnValue(createState())
  })

  it('passes the Accompaniment scope and open state to the owning hook', () => {
    renderDialog()

    expect(useLinkPortionsDialogMock).toHaveBeenCalledWith({
      onBecameGlobal: onBecameGlobalMock,
      onSuccess: expect.any(Function),
      open: true,
      productId: 'accompaniment-1',
    })
  })

  it('renders the title, description, read-only Accompaniment and shared fields without a global switch', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog', { name: 'Vincular porções' })
    expect(dialog.textContent).toContain(
      'Escolha as porções que oferecem este acompanhamento no PDV.',
    )
    const accompaniment = screen.getByDisplayValue('Granola') as HTMLInputElement
    expect(accompaniment.disabled).toBe(true)
    expect(screen.getByRole('group', { name: 'Porções' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Tipo' }).textContent).toContain(
      'Cobertura',
    )
    expect((screen.getByLabelText('Marca atual') as HTMLInputElement).value).toBe(
      'Mãe Terra',
    )
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Preço do acompanhamento',
        }) as HTMLInputElement
      ).value,
    ).toBe('3,00')
    expect(screen.getByRole('textbox', { name: /Quantidade por porção/ })).toBeTruthy()
    expect(screen.getByText('g')).toBeTruthy()
    expect(screen.getByText('R$ 0,45')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Gerenciar tipos →' }).getAttribute('href'),
    ).toBe(ROUTES.accompanimentTypes)
    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('explains that the price applies to the selected Portions and offers no global mode', () => {
    renderDialog()

    expect(screen.getByText('Este preço vale para as porções selecionadas.')).toBeTruthy()
    expect(screen.queryByText(/Este preço vale para todas as porções/)).toBeNull()
    expect(screen.queryByText(/Acompanhamento global/)).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows the plural submit label and enables it when the hook allows saving', () => {
    useLinkPortionsDialogMock.mockReturnValue(
      createState({ portionProductIds: ['a', 'b'], submitLabel: 'Vincular 2 porções' }),
    )
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Vincular 2 porções' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  it('disables submit when nothing can be saved', () => {
    useLinkPortionsDialogMock.mockReturnValue(createState({ canSubmit: false }))
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Vincular porções' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('submits the form through the hook handler', () => {
    const handleSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    )
    useLinkPortionsDialogMock.mockReturnValue(createState({ handleSubmit }))
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Vincular porções' }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('shows the pending label and disables Cancelar and submit while saving', () => {
    useLinkPortionsDialogMock.mockReturnValue(createState({ isPending: true }))
    renderDialog()

    expect(
      screen.getByRole('button', { name: 'Vinculando…' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('closes through Cancelar', () => {
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('announces a rejection inline with role alert', () => {
    useLinkPortionsDialogMock.mockReturnValue(
      createState({
        actionError: 'Uma ou mais porções selecionadas não estão mais disponíveis.',
      }),
    )
    renderDialog()

    expect(screen.getByRole('alert').textContent).toBe(
      'Uma ou mais porções selecionadas não estão mais disponíveis.',
    )
  })

  it('shows validation messages for the picker, type, quantity and price', () => {
    useLinkPortionsDialogMock.mockReturnValue(
      createState({
        errors: {
          accompanimentPrice: { message: 'Informe um preço válido.' },
          accompanimentTypeId: { message: 'Selecione um tipo.' },
          portionProductIds: { message: 'Selecione ao menos uma porção.' },
          quantityPerPortion: { message: 'Informe uma quantidade válida.' },
        },
      }),
    )
    renderDialog()

    expect(screen.getByText('Selecione ao menos uma porção.')).toBeTruthy()
    expect(screen.getByText('Selecione um tipo.')).toBeTruthy()
    expect(screen.getByText('Informe uma quantidade válida.')).toBeTruthy()
    expect(screen.getByText('Informe um preço válido.')).toBeTruthy()
  })

  it('reports background refreshes without replacing the form', () => {
    useLinkPortionsDialogMock.mockReturnValue(createState({ isRefreshing: true }))
    renderDialog()

    expect(screen.getByRole('status', { name: 'Atualizando…' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Porções' })).toBeTruthy()
  })

  it('delegates picker selection and retry of the candidates to the hook', () => {
    const handleSelectedIdsChange = vi.fn()
    const retryCandidates = vi.fn()
    useLinkPortionsDialogMock.mockReturnValue(
      createState({
        candidates: [],
        candidatesError: true,
        handleSelectedIdsChange,
        retryCandidates,
      }),
    )
    renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(retryCandidates).toHaveBeenCalledTimes(1)
  })

  it('selects a Portion through the picker', () => {
    const handleSelectedIdsChange = vi.fn()
    useLinkPortionsDialogMock.mockReturnValue(createState({ handleSelectedIdsChange }))
    renderDialog()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Açaí 300 ml' }))

    expect(handleSelectedIdsChange).toHaveBeenCalledWith(['a'])
  })

  it('retries the stock and the price reads from their inline errors', () => {
    const retrySelectedStock = vi.fn()
    const retryAccompanimentPrice = vi.fn()
    useLinkPortionsDialogMock.mockReturnValue(
      createState({
        accompanimentPriceError: true,
        retryAccompanimentPrice,
        retrySelectedStock,
        selectedStockError: true,
      }),
    )
    renderDialog()

    const retryButtons = screen.getAllByText('Tentar novamente')
    expect(retryButtons).toHaveLength(2)
    fireEvent.click(retryButtons[0])
    fireEvent.click(retryButtons[1])

    expect(retrySelectedStock).toHaveBeenCalledTimes(1)
    expect(retryAccompanimentPrice).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Não foi possível carregar o custo.')).toBeTruthy()
  })
})
