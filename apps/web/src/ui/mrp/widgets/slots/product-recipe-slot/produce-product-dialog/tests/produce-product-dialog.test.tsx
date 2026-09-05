import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductionPreview } from '@scoops/core/mrp/domain/structures'

import { ProduceProductDialog } from '..'
import { useProduceProductDialog } from '../use-produce-product-dialog'

vi.mock('../use-produce-product-dialog', () => ({
  useProduceProductDialog: vi.fn(),
}))

const useProduceProductDialogMock = vi.mocked(useProduceProductDialog)
const product = ProductFaker.fake({ id: 'product-1', name: 'Sorvete', unit: 'un' })
const recipe = {
  id: 'recipe-1',
  yieldQuantity: 10,
  totalCost: 12,
  unitCost: 1.2,
  maximumProducibleQuantity: 30,
  ingredients: [],
}
const preview: ProductionPreview = {
  productId: 'product-1',
  unit: 'un' as const,
  quantity: 10,
  recipeYield: 10,
  canProduce: true,
  blockReasons: [],
  consumptions: [],
  totalCost: 12,
  currentOutputStock: 0,
  projectedOutputStock: 20,
}

type DialogState = ReturnType<typeof useProduceProductDialog>

describe('ProduceProductDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProduceProductDialogMock.mockReturnValue(createState())
  })

  afterEach(cleanup)

  it('renders the projection and delegates mode, input, confirmation and close actions', () => {
    const state = createState()
    useProduceProductDialogMock.mockReturnValue(state)
    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()

    renderDialog({ onOpenChange, onSuccess })

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Registrar produção' })).not.toBeNull()
    expect(screen.getByText('Sorvete · receita de 10 un')).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Lote' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Quantidade' }).getAttribute('aria-pressed'),
    ).toBe('false')
    expect(
      (screen.getByRole('spinbutton', { name: 'Lotes' }) as HTMLInputElement).value,
    ).toBe('1')
    expect(screen.getByText('lotes')).not.toBeNull()
    expect(screen.getByText('Equivale a 10 un')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Confirmar produção' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(
      screen.getByRole('spinbutton', { name: 'Lotes' }).getAttribute('aria-invalid'),
    ).toBe('false')
    expect(
      screen.getByRole('spinbutton', { name: 'Lotes' }).getAttribute('aria-describedby'),
    ).toBe(null)

    fireEvent.click(screen.getByRole('button', { name: 'Quantidade' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Lotes' }), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar produção' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(state.handleModeChange).toHaveBeenCalledWith('quantity')
    expect(state.setValue).toHaveBeenCalledWith('2')
    expect(state.handleConfirm).toHaveBeenCalledWith(onSuccess)
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })

  it('renders quantity mode with the product unit and delegates both mode changes', () => {
    const state = createState({ mode: 'quantity', value: '10', quantity: 10 })
    useProduceProductDialogMock.mockReturnValue(state)

    renderDialog()

    const input = screen.getByRole('spinbutton', { name: 'Quantidade' })
    expect(
      screen.getByRole('button', { name: 'Lote' }).getAttribute('aria-pressed'),
    ).toBe('false')
    expect(
      screen.getByRole('button', { name: 'Quantidade' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect((input as HTMLInputElement).value).toBe('10')
    expect(input.getAttribute('step')).toBe('0.001')
    expect(screen.getByText('un')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Lote' }))
    expect(state.handleModeChange).toHaveBeenCalledWith('batches')
  })

  it('renders consumption rows, projected stock and production block reasons', () => {
    const blockedPreview = {
      ...preview,
      canProduce: false,
      blockReasons: ['Leite insuficiente.', 'Chocolate insuficiente.'],
      consumptions: [
        {
          ingredientProductId: 'ingredient-1',
          ingredientProductName: 'Leite',
          quantity: 2,
          unit: 'l' as const,
          currentBalance: 5,
          projectedBalance: 3,
          missingQuantity: 0,
          unitCost: 2,
          lineCost: 4,
          allowsNegativeStock: false,
        },
        {
          ingredientProductId: 'ingredient-2',
          ingredientProductName: 'Chocolate',
          quantity: 4,
          unit: 'kg' as const,
          currentBalance: 1,
          projectedBalance: -3,
          missingQuantity: 3,
          unitCost: 3,
          lineCost: 12,
          allowsNegativeStock: false,
        },
      ],
      currentOutputStock: 3,
      projectedOutputStock: 13,
    }
    useProduceProductDialogMock.mockReturnValue(
      createState({ preview: createPreviewQuery({ data: blockedPreview }) }),
    )

    renderDialog()

    expect(screen.getByText('Leite')).not.toBeNull()
    expect(screen.getByText('Chocolate')).not.toBeNull()
    expect(screen.getByText('Leite insuficiente. Chocolate insuficiente.')).not.toBeNull()
    expect(screen.getByText('R$ 12,00')).not.toBeNull()
    expect(screen.getByText(/3 un → 13 un/)).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Confirmar produção' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('renders preview loading and recovery states', () => {
    const refetch = vi.fn()
    useProduceProductDialogMock.mockReturnValue(
      createState({
        preview: createPreviewQuery({ data: undefined, isPending: true }),
      }),
    )
    const { rerender } = renderDialog()

    expect(screen.getByRole('status').textContent).toContain('Calculando projeção…')
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true')
    expect(
      (screen.getByRole('button', { name: 'Confirmar produção' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    useProduceProductDialogMock.mockReturnValue(
      createState({
        preview: createPreviewQuery({
          data: undefined,
          isError: true,
          isPending: false,
          refetch,
        }),
      }),
    )
    rerender(
      <ProduceProductDialog
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        product={product}
        recipe={recipe}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível calcular a produção.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders validation and mutation errors and disables pending actions', () => {
    const state = createState({
      error: 'Não foi possível registrar a produção.',
      isInputValid: false,
      isPending: true,
      quantity: 0,
      validationError: 'Informe um número inteiro positivo de lotes.',
    })
    useProduceProductDialogMock.mockReturnValue(state)

    renderDialog()

    const input = screen.getByRole('spinbutton', { name: 'Lotes' })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('production-quantity-error')
    expect(
      screen.getByText('Informe um número inteiro positivo de lotes.'),
    ).not.toBeNull()
    expect(screen.getByText('Não foi possível registrar a produção.')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Confirmando…' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(state.handleConfirm).not.toHaveBeenCalled()
  })

  it('renders a closed dialog without invoking the hook actions', () => {
    const onOpenChange = vi.fn()
    const onSuccess = vi.fn()
    const state = createState()
    useProduceProductDialogMock.mockReturnValue(state)

    renderDialog({ onOpenChange, onSuccess, open: false })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(state.handleConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

function renderDialog(props: Partial<ComponentProps<typeof ProduceProductDialog>> = {}) {
  return render(
    <ProduceProductDialog
      open
      onOpenChange={vi.fn()}
      onSuccess={vi.fn()}
      product={product}
      recipe={recipe}
      {...props}
    />,
  )
}

function createState(overrides: Partial<DialogState> = {}): DialogState {
  return {
    error: null,
    handleConfirm: vi.fn(),
    handleModeChange: vi.fn(),
    isInputValid: true,
    isPending: false,
    mode: 'batches',
    preview: createPreviewQuery({ data: preview }),
    quantity: 10,
    setValue: vi.fn(),
    validationError: null,
    value: '1',
    ...overrides,
  }
}

function createPreviewQuery(
  overrides: Partial<DialogState['preview']> = {},
): DialogState['preview'] {
  return {
    data: preview,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
    ...overrides,
  } as DialogState['preview']
}
