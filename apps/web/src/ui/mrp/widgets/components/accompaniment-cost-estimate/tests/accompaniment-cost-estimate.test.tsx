import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentCostEstimate, type AccompanimentCostEstimateProps } from '../index'
import { useCostEstimate } from '../use-cost-estimate'

vi.mock('../use-cost-estimate', () => ({ useCostEstimate: vi.fn() }))

const useCostEstimateMock = vi.mocked(useCostEstimate)
const props: AccompanimentCostEstimateProps = {
  estimatedCost: 0.45,
  numericQuantity: 50,
  selectedStockError: false,
  selectedStockLoading: false,
  sourceUnitCost: 0.00899,
}

describe('AccompanimentCostEstimate', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useCostEstimateMock.mockReturnValue({
      estimate: 'R$ 0,45',
      formattedQuantity: '50 g',
      formattedUnitCost: '0,00899',
      hasDetails: true,
      unit: 'g',
    })
  })

  it('shows the cost per Portion with its calculation details', () => {
    render(<AccompanimentCostEstimate {...props} />)

    expect(screen.getByText('CUSTO POR PORÇÃO')).toBeTruthy()
    expect(screen.getByText('R$ 0,45')).toBeTruthy()
    expect(screen.getByText('50 g × R$ 0,00899/g').hasAttribute('hidden')).toBe(false)
    expect(useCostEstimateMock).toHaveBeenCalledWith(props)
  })

  it('hides the calculation details when there is nothing to calculate', () => {
    useCostEstimateMock.mockReturnValue({
      estimate: 'Não disponível',
      formattedQuantity: '0 g',
      formattedUnitCost: '0,00',
      hasDetails: false,
      unit: 'g',
    })
    render(<AccompanimentCostEstimate {...props} estimatedCost={undefined} />)

    expect(screen.getByText('Não disponível')).toBeTruthy()
    expect(screen.getByText('0 g × R$ 0,00/g').hasAttribute('hidden')).toBe(true)
  })
})
