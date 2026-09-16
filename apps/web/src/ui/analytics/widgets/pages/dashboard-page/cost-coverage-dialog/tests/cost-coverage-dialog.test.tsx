import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CostCoverageDialog } from '../index'
import type { SalesAnalytics } from '@scoops/core/analytics/domain/structures'

afterEach(cleanup)

describe('CostCoverageDialog', () => {
  const analytics = {
    margin: {
      coveragePercentage: 100,
      cogsCents: 9276,
      uncoveredNetSalesCents: 0,
      affectedProducts: [],
    },
  } as unknown as SalesAnalytics

  it('renders the coverage details as an accessible modal dialog', () => {
    render(<CostCoverageDialog analytics={analytics} onClose={vi.fn()} open />)

    expect(
      screen.getByRole('dialog', { name: 'Detalhes da cobertura de custos' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Todas as vendas do período possuem cobertura de custos.'),
    ).toBeTruthy()
    expect(screen.getByText('Custo dos produtos vendidos (CMV)')).toBeTruthy()
    expect(screen.getByText('R$ 92,76')).toBeTruthy()
  })

  it('closes through the localized close control', () => {
    const onClose = vi.fn()

    render(<CostCoverageDialog onClose={onClose} open />)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhes da cobertura' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
