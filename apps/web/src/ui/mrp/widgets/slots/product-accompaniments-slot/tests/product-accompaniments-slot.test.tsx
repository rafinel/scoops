import type { ReactNode } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductAccompanimentsDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentsSlot } from '../index'
import { useProductAccompanimentsSlot } from '../use-product-accompaniments-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('../use-product-accompaniments-slot', () => ({
  useProductAccompanimentsSlot: vi.fn(),
}))

const useProductAccompanimentsSlotMock = vi.mocked(useProductAccompanimentsSlot)
const product = ProductFaker.fake({ categories: ['portion'], name: 'Açaí especial' })
const details: ProductAccompanimentsDetails = {
  product,
  accompaniments: [
    {
      id: 'link-1',
      accompanimentProductId: 'product-2',
      accompanimentProductName: 'Granola',
      accompanimentTypeId: 'type-1',
      accompanimentTypeName: 'Cobertura',
      unit: 'g',
      quantityPerPortion: 20,
      estimatedCost: 0.45,
    },
  ],
}

const fakeSlotState = () => ({
  details,
  handleActionOpenChange: vi.fn(),
  handleActionSuccess: vi.fn(),
  handleBack: vi.fn(),
  handleRetry: vi.fn(),
  isError: false,
  isLoading: false,
  product,
  selectedAction: undefined,
  setSelectedAction: vi.fn(),
})

describe('ProductAccompanimentsSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductAccompanimentsSlotMock.mockReturnValue(fakeSlotState() as never)
  })

  it('renders the populated accompaniment card through the slot boundary', () => {
    render(<ProductAccompanimentsSlot productId='product-1' />)

    expect(
      screen.getByRole('heading', { name: /Acompanhamentos \(1\)/ }).textContent,
    ).toContain('(1)')
    expect(screen.getByText('Granola').textContent).toBe('Granola')
  })

  it('renders loading, error and empty states from the slot controller', () => {
    useProductAccompanimentsSlotMock.mockReturnValue({
      ...fakeSlotState(),
      details: undefined,
      isLoading: true,
      product: undefined,
    } as never)
    const { rerender } = render(<ProductAccompanimentsSlot productId='product-1' />)
    expect(
      screen.getByRole('status', { name: 'Carregando acompanhamentos' }),
    ).toBeTruthy()

    const handleRetry = vi.fn()
    useProductAccompanimentsSlotMock.mockReturnValue({
      ...fakeSlotState(),
      details: undefined,
      handleRetry,
      isError: true,
      product: undefined,
    } as never)
    rerender(<ProductAccompanimentsSlot productId='product-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledTimes(1)

    useProductAccompanimentsSlotMock.mockReturnValue({
      ...fakeSlotState(),
      details: { ...details, accompaniments: [] },
    } as never)
    rerender(<ProductAccompanimentsSlot productId='product-1' />)
    expect(
      screen.getByRole('heading', { name: 'Nenhum acompanhamento vinculado' }),
    ).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: 'Vincular acompanhamento' }),
    ).toHaveLength(2)
  })
})
