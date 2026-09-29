import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import type { ProductRecipeDetails } from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductRecipeSlot } from '../index'
import { useProductRecipeSlot } from '../use-product-recipe-slot'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))
vi.mock('../use-product-recipe-slot', () => ({ useProductRecipeSlot: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('../product-recipe-card/use-product-recipe-card', () => ({
  useProductRecipeCard: vi.fn(() => ({
    error: null,
    handleSaveYield: vi.fn(),
    isPending: false,
    setYieldQuantity: vi.fn(),
    yieldQuantity: '',
  })),
}))

const mockedUseProductRecipeSlot = vi.mocked(useProductRecipeSlot)
const useAuthContextMock = vi.mocked(useAuthContext)
const details: ProductRecipeDetails = {
  product: ProductFaker.fake({ id: 'product-1', name: 'Sorvete' }),
  recipe: null,
}
const baseSlot = () => ({
  details,
  isError: false,
  isLoading: false,
  isRefreshing: false,
  isUnsupported: false,
  product: details.product,
  selectedAction: undefined,
  handleActionOpenChange: vi.fn(),
  handleActionSuccess: vi.fn(),
  handleBack: vi.fn(),
  handleAddAction: vi.fn(),
  handleEditAction: vi.fn(),
  handleProduceAction: vi.fn(),
  handleRemoveAction: vi.fn(),
  handleRetry: vi.fn(),
})

describe('ProductRecipeSlot', () => {
  afterEach(cleanup)
  beforeEach(() => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
  })

  it('renders the recipe card once data is ready', () => {
    mockedUseProductRecipeSlot.mockReturnValue(baseSlot())
    render(<ProductRecipeSlot productId='product-1' />)
    expect(screen.getByRole('heading', { name: 'Receita' })).toBeTruthy()
  })

  it('announces loading and exposes retry on failure', () => {
    mockedUseProductRecipeSlot.mockReturnValue({
      ...baseSlot(),
      details: undefined,
      isLoading: true,
    })
    const { rerender } = render(<ProductRecipeSlot productId='product-1' />)
    expect(screen.getByRole('status', { name: 'Carregando receita' })).toBeTruthy()

    const handleRetry = vi.fn()
    mockedUseProductRecipeSlot.mockReturnValue({
      ...baseSlot(),
      details: undefined,
      isError: true,
      handleRetry,
    })
    rerender(<ProductRecipeSlot productId='product-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps recipe facts visible and does not open write dialogs for Operators', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    mockedUseProductRecipeSlot.mockReturnValue({
      ...baseSlot(),
      selectedAction: { kind: 'add' },
    })
    render(<ProductRecipeSlot productId='product-1' />)
    expect(screen.getByRole('heading', { name: 'Receita' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Produzir/ })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Adicionar primeiro ingrediente' }),
    ).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
