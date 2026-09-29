import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { ProductPricingSlot } from '../index'
import { useProductPricingSlot } from '../use-product-pricing-slot'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../use-product-pricing-slot', () => ({
  useProductPricingSlot: vi.fn(),
}))
vi.mock('../product-resale-settings-card/use-product-resale-settings-card', () => ({
  useProductResaleSettingsCard: () => ({
    handleSave: vi.fn(),
    handleValueChange: vi.fn(),
    rows: { single: { isActive: true, isPending: false, price: '9.50' } },
  }),
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))

const useProductPricingSlotMock = vi.mocked(useProductPricingSlot)
const useAuthContextMock = vi.mocked(useAuthContext)

describe('ProductPricingSlot', () => {
  afterEach(cleanup)
  beforeEach(() => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useProductPricingSlotMock.mockReturnValue({
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      pricing: {
        mode: 'portion',
        product: ProductFaker.fake({ categories: ['portion'], name: 'Açaí' }),
        resale: [],
        sizes: [],
      },
      selectedAction: undefined,
    })
  })

  it('renders the loading state through the pricing slot boundary', () => {
    useProductPricingSlotMock.mockReturnValue({
      ...useProductPricingSlotMock.mock.results[0]?.value,
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: true,
      isRefreshingPricing: false,
      pricing: undefined,
      selectedAction: undefined,
    })

    render(<ProductPricingSlot productId='product-1' />)

    expect(
      screen.getByRole('status', { name: 'Carregando preços do produto' }),
    ).toBeTruthy()
  })

  it('renders the Portion empty action and accessible section heading', () => {
    render(<ProductPricingSlot productId='product-1' />)

    expect(screen.getByRole('heading', { name: 'Tamanhos e preços' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Adicionar primeiro tamanho' }),
    ).toBeTruthy()
  })

  it('keeps pricing facts readable and hides size management for Operators', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    useProductPricingSlotMock.mockReturnValue({
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      pricing: {
        mode: 'portion',
        product: ProductFaker.fake({ categories: ['portion'], name: 'Açaí' }),
        resale: [],
        sizes: [],
      },
      selectedAction: { kind: 'add' },
    })
    render(<ProductPricingSlot productId='product-1' />)
    expect(screen.getByRole('heading', { name: 'Tamanhos e preços' })).toBeTruthy()
    expect(screen.getByText('Nenhum tamanho cadastrado')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Adicionar primeiro tamanho' }),
    ).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows resale price facts without editable controls for Operators', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    useProductPricingSlotMock.mockReturnValue({
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      pricing: {
        mode: 'resale-single',
        product: ProductFaker.fake({ categories: ['resale'], name: 'Açaí avulso' }),
        resale: [{ packageQuantity: 1, price: 9.5, isActive: true }],
        sizes: [],
      },
      selectedAction: undefined,
    } as never)
    render(<ProductPricingSlot productId='product-1' />)
    expect(screen.getByRole('heading', { name: 'Preço de Revenda' })).toBeTruthy()
    expect(screen.getByText('Disponível')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
  })
})
