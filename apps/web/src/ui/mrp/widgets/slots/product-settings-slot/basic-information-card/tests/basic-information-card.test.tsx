import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { BasicInformationCard } from '../index'
import { useBasicInformationCard } from '../use-basic-information-card'

vi.mock('../use-basic-information-card', () => ({ useBasicInformationCard: vi.fn() }))
const useBasicInformationCardMock = vi.mocked(useBasicInformationCard)
const product = ProductFaker.fake({ name: 'Produto teste', unit: 'kg', idealStock: 12 })

describe('BasicInformationCard', () => {
  afterEach(cleanup)

  it('renders values and uses the owning hook for blur and immediate state', () => {
    const nameBlur = vi.fn()
    const stockBlur = vi.fn()
    const statusChange = vi.fn()
    useBasicInformationCardMock.mockReturnValue({
      errors: {},
      handleNameChange: vi.fn(),
      handleIdealStockChange: vi.fn(),
      handleNameBlur: nameBlur,
      handleIdealStockBlur: stockBlur,
      handleRetry: vi.fn(),
      handleRevert: vi.fn(),
      handleStatusChange: statusChange,
      handleUnitChange: vi.fn(),
      isPending: false,
      pendingField: undefined,
      name: product.name,
      idealStock: '12',
      status: 'active',
      unitTriggerRef: { current: null },
    })
    render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)
    expect(screen.getByDisplayValue(product.name)).toBeTruthy()
    expect(screen.getByDisplayValue('12')).toBeTruthy()
    fireEvent.blur(screen.getByDisplayValue(product.name))
    fireEvent.blur(screen.getByDisplayValue('12'))
    expect(nameBlur).toHaveBeenCalledOnce()
    expect(stockBlur).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox', { name: 'Unidade de estoque' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Status' }).textContent).toContain(
      'Ativo',
    )
  })

  it('associates field errors and disables status while its save is pending', () => {
    useBasicInformationCardMock.mockReturnValue({
      errors: {
        name: 'Informe um nome.',
        idealStock: 'Informe um estoque válido.',
        status: 'Não foi possível salvar.',
      },
      handleNameChange: vi.fn(),
      handleIdealStockChange: vi.fn(),
      handleNameBlur: vi.fn(),
      handleIdealStockBlur: vi.fn(),
      handleRetry: vi.fn(),
      handleRevert: vi.fn(),
      handleStatusChange: vi.fn(),
      handleUnitChange: vi.fn(),
      isPending: true,
      pendingField: 'status',
      name: product.name,
      idealStock: '12',
      status: 'active',
      unitTriggerRef: { current: null },
    })

    render(<BasicInformationCard onUnitChange={vi.fn()} product={product} />)

    const name = screen.getByRole('textbox', { name: /Nome do produto/ })
    const idealStock = screen.getByDisplayValue('12')
    const status = screen.getByRole('combobox', { name: /Status/ })
    expect(name.getAttribute('aria-describedby')).toBe('basic-information-name-error')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(idealStock.getAttribute('aria-describedby')).toBe(
      'basic-information-ideal-stock-error',
    )
    expect((status as HTMLButtonElement).disabled).toBe(true)
    expect(status.getAttribute('aria-describedby')).toBe('basic-information-status-error')
  })
})
