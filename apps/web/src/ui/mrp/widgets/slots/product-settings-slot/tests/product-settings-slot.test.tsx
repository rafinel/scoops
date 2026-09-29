import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { RestContextProvider } from '@/ui/shared/contexts/rest-context'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { ProductSettingsSlot } from '../index'
import { useProductSettingsSlot } from '../use-product-settings-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))
vi.mock('../basic-information-card', () => ({
  BasicInformationCard: () => <section aria-label='Informações básicas' />,
}))
vi.mock('../stock-control-card', () => ({
  StockControlCard: () => <section aria-label='Controle de estoque' />,
}))
vi.mock('../product-categories-card', () => ({
  ProductCategoriesCard: () => <section aria-label='Categorias do produto' />,
}))
vi.mock('../internal-notes-card', () => ({
  InternalNotesCard: () => <section aria-label='Anotações internas' />,
}))
vi.mock('../product-danger-zone', () => ({
  ProductDangerZone: () => <section aria-label='Zona de Perigo' />,
}))
vi.mock('../remove-product-dialog/use-remove-product-dialog', () => ({
  useRemoveProductDialog: () => ({
    handleConfirm: vi.fn(),
    handleOpenChange: vi.fn(),
    isLoadingProductRemovalImpact: false,
    isPendingProductRemovalImpact: false,
    hasProductRemovalImpactError: false,
    productRemovalImpactError: null,
    retryProductRemovalImpact: vi.fn(),
    isRemovingProduct: false,
    removeProductError: null,
    productRemovalImpact: undefined,
  }),
}))
vi.mock('../use-product-settings-slot', () => ({ useProductSettingsSlot: vi.fn() }))

const useProductSettingsSlotMock = vi.mocked(useProductSettingsSlot)
const useAuthContextMock = vi.mocked(useAuthContext)
const product = ProductFaker.fake({ name: 'Açaí settings', categories: ['ingredient'] })

describe('ProductSettingsSlot', () => {
  afterEach(cleanup)
  beforeEach(() => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useProductSettingsSlotMock.mockReturnValue({
      settings: { product },
      settingsError: null,
      hasSettingsError: false,
      isLoadingSettings: false,
      isRefreshingSettings: false,
      targetUnit: undefined,
      isUnitDialogOpen: false,
      isRemovalDialogOpen: false,
      retrySearch: {},
      handleBack: vi.fn(),
      handleRetry: vi.fn(),
      handleUnitChange: vi.fn(),
      handleUnitDialogOpenChange: vi.fn(),
      handleOpenRemoval: vi.fn(),
      handleRemovalOpenChange: vi.fn(),
    })
  })

  it('renders the complete settings section inventory', () => {
    render(
      <RestContextProvider>
        <ProductSettingsSlot productId={product.id} retrySearch={{}} />
      </RestContextProvider>,
    )
    expect(screen.getByRole('region', { name: 'Informações básicas' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Controle de estoque' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Categorias do produto' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Anotações internas' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Zona de Perigo' })).toBeTruthy()
  })

  it('shows read-only product settings to Operators without management cards', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    render(<ProductSettingsSlot productId={product.id} retrySearch={{}} />)
    expect(screen.getByRole('heading', { name: 'Configurações do produto' })).toBeTruthy()
    expect(screen.getByText('Açaí settings')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Informações básicas' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Zona de Perigo' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover produto' })).toBeNull()
  })

  it('renders a stable loading state and a retryable read error', () => {
    useProductSettingsSlotMock.mockReturnValueOnce({
      settings: undefined,
      settingsError: null,
      hasSettingsError: false,
      isLoadingSettings: true,
      isRefreshingSettings: false,
      targetUnit: undefined,
      isUnitDialogOpen: false,
      isRemovalDialogOpen: false,
      retrySearch: {},
      handleBack: vi.fn(),
      handleRetry: vi.fn(),
      handleUnitChange: vi.fn(),
      handleUnitDialogOpenChange: vi.fn(),
      handleOpenRemoval: vi.fn(),
      handleRemovalOpenChange: vi.fn(),
    })
    const { unmount } = render(
      <RestContextProvider>
        <ProductSettingsSlot productId={product.id} retrySearch={{}} />
      </RestContextProvider>,
    )
    expect(
      screen.getByRole('status', { name: 'Carregando configurações do produto' }),
    ).toBeTruthy()
    unmount()

    const retry = vi.fn()
    useProductSettingsSlotMock.mockReturnValueOnce({
      ...useProductSettingsSlotMock.mock.results[0]?.value,
      settings: undefined,
      hasSettingsError: true,
      isLoadingSettings: false,
      handleRetry: retry,
    })
    render(
      <RestContextProvider>
        <ProductSettingsSlot productId={product.id} retrySearch={{}} />
      </RestContextProvider>,
    )
    screen.getByRole('button', { name: 'Tentar novamente' }).click()
    expect(retry).toHaveBeenCalledOnce()
  })
})
