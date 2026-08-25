import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { StockControlCard } from '../index'
import { useStockControlCard } from '../use-stock-control-card'

vi.mock('../use-stock-control-card', () => ({ useStockControlCard: vi.fn() }))
const hookMock = vi.mocked(useStockControlCard)

describe('StockControlCard', () => {
  it('keeps stock mode read-only and exposes the negative-stock switch', () => {
    hookMock.mockReturnValue({
      allowNegativeStock: false,
      error: undefined,
      handleAllowNegativeStockChange: vi.fn(),
      handleRetry: vi.fn(),
      handleRevert: vi.fn(),
      isPending: false,
    })
    render(<StockControlCard product={ProductFaker.fake({ stockControl: 'by-brand' })} />)
    expect(screen.getByText('Por marca')).toBeTruthy()
    expect(
      screen.getByRole('checkbox', { name: 'Permitir estoque negativo' }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: /modo/i })).toBeNull()
  })
})
