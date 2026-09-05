import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { BasicInformationCard } from '../index'
import { useBasicInformationCard } from '../use-basic-information-card'

vi.mock('../use-basic-information-card', () => ({ useBasicInformationCard: vi.fn() }))
const useBasicInformationCardMock = vi.mocked(useBasicInformationCard)
const product = ProductFaker.fake({ name: 'Produto teste', unit: 'kg', idealStock: 12 })

type BasicInformationCardState = ReturnType<typeof useBasicInformationCard>

function createHookState(
  overrides: Partial<BasicInformationCardState> = {},
): BasicInformationCardState {
  return {
    errors: {},
    handleNameChange: vi.fn(),
    handleIdealStockChange: vi.fn(),
    handleNameBlur: vi.fn(),
    handleIdealStockBlur: vi.fn(),
    handleRetry: vi.fn(),
    handleRevert: vi.fn(),
    handleStatusChange: vi.fn(),
    handleUnitChange: vi.fn(),
    isPending: false,
    pendingField: undefined,
    name: product.name,
    idealStock: '12',
    status: 'active',
    unitTriggerRef: { current: null },
    ...overrides,
  }
}

describe('BasicInformationCard', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    useBasicInformationCardMock.mockReset()
  })

  it('renders values and uses the owning hook for blur and immediate state', () => {
    const nameBlur = vi.fn()
    const stockBlur = vi.fn()
    const statusChange = vi.fn()
    const handleNameChange = vi.fn()
    const handleIdealStockChange = vi.fn()
    useBasicInformationCardMock.mockReturnValue(
      createHookState({
        handleIdealStockChange,
        handleNameBlur: nameBlur,
        handleNameChange,
        handleIdealStockBlur: stockBlur,
        handleStatusChange: statusChange,
      }),
    )
    render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)

    const name = screen.getByRole('textbox', { name: 'Nome do produto' })
    const idealStock = screen.getByRole('textbox', { name: /Estoque ideal/ })
    expect((name as HTMLInputElement).value).toBe(product.name)
    expect((idealStock as HTMLInputElement).value).toBe('12')
    fireEvent.change(name, { target: { value: 'Produto atualizado' } })
    fireEvent.change(idealStock, { target: { value: '24' } })
    fireEvent.blur(name)
    fireEvent.blur(idealStock)
    expect(handleNameChange).toHaveBeenCalledWith('Produto atualizado')
    expect(handleIdealStockChange).toHaveBeenCalledWith('24')
    expect(nameBlur).toHaveBeenCalledOnce()
    expect(stockBlur).toHaveBeenCalledOnce()
    expect(
      (screen.getByRole('combobox', { name: 'Unidade de estoque' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toContain(
      'Ativo',
    )
  })

  it('renders localized status and unit options and delegates their selections', () => {
    const handleStatusChange = vi.fn()
    const handleUnitChange = vi.fn()
    useBasicInformationCardMock.mockReturnValue(
      createHookState({ handleStatusChange, handleUnitChange, status: 'inactive' }),
    )
    render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)

    const unit = screen.getByRole('combobox', { name: 'Unidade de estoque' })
    const status = screen.getByRole('combobox', { name: 'Status' })
    expect(status.textContent).toContain('Inativo')

    fireEvent.click(unit)
    expect(screen.getByRole('option', { name: 'Mililitros (ml)' })).toBeTruthy()
    selectOption(screen.getByRole('option', { name: 'Mililitros (ml)' }))
    expect(handleUnitChange).toHaveBeenCalledWith('ml')

    fireEvent.click(status)
    expect(screen.getByRole('option', { name: 'Ativo' })).toBeTruthy()
    selectOption(screen.getByRole('option', { name: 'Ativo' }))
    expect(handleStatusChange).toHaveBeenCalledWith('active')
  })

  it.each(['name', 'idealStock', 'status'] as const)(
    'disables the %s control while its save is pending',
    (pendingField) => {
      useBasicInformationCardMock.mockReturnValue(
        createHookState({ isPending: true, pendingField }),
      )

      render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)

      expect(screen.getByRole('status').textContent).toContain('Salvando alteração')
      expect(
        (screen.getByRole('textbox', { name: 'Nome do produto' }) as HTMLInputElement)
          .disabled,
      ).toBe(pendingField === 'name')
      expect(
        (screen.getByRole('textbox', { name: /Estoque ideal/ }) as HTMLInputElement)
          .disabled,
      ).toBe(pendingField === 'idealStock')
      expect(
        (screen.getByRole('combobox', { name: 'Status' }) as HTMLButtonElement).disabled,
      ).toBe(pendingField === 'status')
    },
  )

  it('presents field errors with recovery actions and delegates retry and revert', () => {
    const handleRetry = vi.fn()
    const handleRevert = vi.fn()
    useBasicInformationCardMock.mockReturnValue(
      createHookState({
        errors: {
          name: 'Informe o nome do produto.',
          idealStock: 'Informe um estoque ideal válido.',
          status: 'Não foi possível salvar.',
        },
        handleRetry,
        handleRevert,
      }),
    )

    render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)

    expect(screen.getByText('Informe o nome do produto.')).toBeTruthy()
    expect(screen.getByText('Informe um estoque ideal válido.')).toBeTruthy()
    expect(screen.getByText('Não foi possível salvar.')).toBeTruthy()
    expect(
      screen.getByText('Corrija os campos destacados para salvar as informações.'),
    ).toBeTruthy()

    const retryButtons = screen.getAllByRole('button', { name: 'Tentar novamente' })
    const revertButtons = screen.getAllByRole('button', { name: 'Reverter' })
    fireEvent.click(retryButtons[0])
    fireEvent.click(retryButtons[1])
    fireEvent.click(retryButtons[2])
    fireEvent.click(revertButtons[0])
    fireEvent.click(revertButtons[1])
    fireEvent.click(revertButtons[2])
    expect(handleRetry).toHaveBeenNthCalledWith(1, 'name')
    expect(handleRetry).toHaveBeenNthCalledWith(2, 'idealStock')
    expect(handleRetry).toHaveBeenNthCalledWith(3, 'status')
    expect(handleRevert).toHaveBeenNthCalledWith(1, 'name')
    expect(handleRevert).toHaveBeenNthCalledWith(2, 'idealStock')
    expect(handleRevert).toHaveBeenNthCalledWith(3, 'status')
  })
})

function selectOption(option: HTMLElement) {
  fireEvent.pointerDown(option, { button: 0, pointerId: 1 })
  fireEvent.pointerUp(option, { button: 0, pointerId: 1 })
  fireEvent.click(option)
}
