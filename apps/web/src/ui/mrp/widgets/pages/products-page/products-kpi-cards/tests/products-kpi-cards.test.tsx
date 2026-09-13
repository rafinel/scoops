import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductsKpiCards } from '../index'
import { useProductsKpiCards } from '../use-products-kpi-cards'

vi.mock('../use-products-kpi-cards', () => ({ useProductsKpiCards: vi.fn() }))
const useProductsKpiCardsMock = vi.mocked(useProductsKpiCards)

describe('ProductsKpiCards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI labels and values', () => {
    useProductsKpiCardsMock.mockReturnValue({
      cards: [
        {
          label: 'Produtos',
          displayValue: 12,
          detail: 'na lista atual',
          icon: 'package',
          iconTone: '',
          railColor: '',
          valueTone: '',
        },
        {
          label: 'Marcas',
          displayValue: 4,
          detail: 'vinculadas',
          icon: 'tags',
          iconTone: '',
          railColor: '',
          valueTone: '',
        },
        {
          label: 'Estoque baixo',
          displayValue: 2,
          detail: 'precisam repor',
          icon: 'triangle-alert',
          iconTone: '',
          railColor: '',
          valueTone: '',
        },
      ],
    } as never)
    render(<ProductsKpiCards isLoading={false} />)

    expect(screen.getByText('Produtos')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('uses the shared skeleton contract for an initial empty load', () => {
    useProductsKpiCardsMock.mockReturnValue({
      cards: [
        { label: 'Produtos', displayValue: 0, detail: '', icon: 'package' },
        { label: 'Marcas', displayValue: 0, detail: '', icon: 'tags' },
        { label: 'Estoque baixo', displayValue: 0, detail: '', icon: 'triangle-alert' },
      ],
    } as never)

    render(<ProductsKpiCards isLoading page={undefined} />)

    expect(screen.getAllByLabelText('Carregando indicador')).toHaveLength(3)
  })
})
