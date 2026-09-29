import type { ReactNode } from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ProductAccompanimentsDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentsSlot } from '../index'
import { useProductAccompanimentsSlot } from '../use-product-accompaniments-slot'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('../use-product-accompaniments-slot', () => ({
  useProductAccompanimentsSlot: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))

const useProductAccompanimentsSlotMock = vi.mocked(useProductAccompanimentsSlot)
const useAuthContextMock = vi.mocked(useAuthContext)
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
  handleAddAction: vi.fn(),
  handleEditAction: vi.fn(),
  handleRemoveAction: vi.fn(),
  handleRetry: vi.fn(),
  isError: false,
  isLoading: false,
  isRefreshing: false,
  product,
  selectedAction: undefined,
})

describe('ProductAccompanimentsSlot', () => {
  afterEach(cleanup)
  beforeEach(() => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    vi.clearAllMocks()
    useProductAccompanimentsSlotMock.mockReturnValue(fakeSlotState() as never)
  })

  it('keeps accompaniment details visible and suppresses edit dialogs for Operators', () => {
    const accompaniment = details.accompaniments[0]
    if (!accompaniment) throw new Error('Expected fixture accompaniment')
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    useProductAccompanimentsSlotMock.mockReturnValue({
      ...fakeSlotState(),
      selectedAction: { kind: 'edit', item: accompaniment },
    })
    render(<ProductAccompanimentsSlot productId={product.id} />)
    expect(screen.getByText('Acompanhamentos')).toBeTruthy()
    expect(screen.getByText('Granola')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Vincular acompanhamento' })).toBeNull()
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
    ).toHaveLength(1)
  })

  it('keeps populated content visible while reporting a refresh', () => {
    useProductAccompanimentsSlotMock.mockReturnValue({
      ...fakeSlotState(),
      isRefreshing: true,
    } as never)

    render(<ProductAccompanimentsSlot productId='product-1' />)

    expect(screen.getByRole('status', { name: 'Atualizando…' }).textContent).toBe(
      'Atualizando…',
    )
    expect(screen.getAllByText('Granola')).not.toHaveLength(0)
  })
})
