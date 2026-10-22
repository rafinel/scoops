import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type CostEstimateProps, useCostEstimate } from '../use-cost-estimate'

const baseProps: CostEstimateProps = {
  estimatedCost: 0.45,
  numericQuantity: 50,
  selectedProductUnit: 'g',
  selectedStockError: false,
  selectedStockLoading: false,
  sourceUnitCost: 0.00899,
}

function renderEstimate(overrides: Partial<CostEstimateProps> = {}) {
  return renderHook(() => useCostEstimate({ ...baseProps, ...overrides })).result.current
}

describe('useCostEstimate', () => {
  it('formats the estimate, quantity and unit cost when a unit cost exists', () => {
    const estimate = renderEstimate()

    expect(estimate.estimate).toContain('0,45')
    expect(estimate.formattedUnitCost).toBe('0,00899')
    expect(estimate.hasDetails).toBe(true)
    expect(estimate.unit).toBe('g')
    expect(estimate.formattedQuantity).toContain('50')
  })

  it('prefers the linked item unit over the selected product unit', () => {
    expect(renderEstimate({ item: { unit: 'kg' } }).unit).toBe('kg')
  })

  it('falls back to the unit symbol when nothing is selected', () => {
    expect(renderEstimate({ selectedProductUnit: undefined }).unit).toBe('un')
  })

  it('is unavailable without an estimated cost', () => {
    const estimate = renderEstimate({
      estimatedCost: undefined,
      sourceUnitCost: undefined,
    })

    expect(estimate.estimate).toBe('Não disponível')
    expect(estimate.hasDetails).toBe(false)
  })

  it('has no details for a zero quantity', () => {
    expect(renderEstimate({ numericQuantity: 0 }).hasDetails).toBe(false)
  })

  it('reports a load failure only for a selected product', () => {
    expect(renderEstimate({ selectedStockError: true }).estimate).toBe(
      'Não foi possível carregar o custo.',
    )
    expect(
      renderEstimate({
        estimatedCost: undefined,
        selectedProductUnit: undefined,
        selectedStockError: true,
      }).estimate,
    ).toBe('Não disponível')
  })

  it('reports loading only for a selected product', () => {
    expect(renderEstimate({ selectedStockLoading: true }).estimate).toBe('Carregando…')
    expect(
      renderEstimate({
        estimatedCost: undefined,
        selectedProductUnit: undefined,
        selectedStockLoading: true,
      }).estimate,
    ).toBe('Não disponível')
  })
})
