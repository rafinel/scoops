import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductDetailsPlaceholderSlot } from '../index'
import { useProductDetailsPlaceholderSlot } from '../use-product-details-placeholder-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('../use-product-details-placeholder-slot', () => ({
  useProductDetailsPlaceholderSlot: vi.fn(),
}))

const useProductDetailsPlaceholderSlotMock = vi.mocked(useProductDetailsPlaceholderSlot)

const product = ProductFaker.fake({ categories: ['portion'], name: 'Açaí especial' })

describe('ProductDetailsPlaceholderSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProductDetailsPlaceholderSlotMock.mockReturnValue({
      handleBack: vi.fn(),
      handleRetry: vi.fn(),
      hasProductError: false,
      isLoadingProduct: false,
      isUnsupported: false,
      product,
    })
  })

  it('renders the placeholder content for a supported product', () => {
    render(
      <ProductDetailsPlaceholderSlot
        description='Configure esta área em breve.'
        icon='settings'
        productId='product-1'
        selectedTab='settings'
        title='Configurações'
      />,
    )

    expect(screen.getByRole('heading', { name: 'Configurações' }).textContent).toBe(
      'Configurações',
    )
    expect(screen.getByText('Em breve').textContent).toBe('Em breve')
  })

  it('renders loading and recovery states through the same boundary', () => {
    useProductDetailsPlaceholderSlotMock.mockReturnValue({
      handleBack: vi.fn(),
      handleRetry: vi.fn(),
      hasProductError: true,
      isLoadingProduct: false,
      isUnsupported: false,
      product: undefined,
    })

    const { rerender } = render(
      <ProductDetailsPlaceholderSlot
        description='Configure esta área em breve.'
        icon='settings'
        productId='product-1'
        selectedTab='settings'
        title='Configurações'
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar o produto',
    )

    useProductDetailsPlaceholderSlotMock.mockReturnValue({
      handleBack: vi.fn(),
      handleRetry: vi.fn(),
      hasProductError: false,
      isLoadingProduct: true,
      isUnsupported: false,
      product: undefined,
    })
    rerender(
      <ProductDetailsPlaceholderSlot
        description='Configure esta área em breve.'
        icon='settings'
        productId='product-1'
        selectedTab='settings'
        title='Configurações'
      />,
    )

    expect(screen.getByRole('status', { name: 'Carregando produto' })).toBeTruthy()
  })
})
