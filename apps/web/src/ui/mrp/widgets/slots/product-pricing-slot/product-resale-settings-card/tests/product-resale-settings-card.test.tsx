import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductResaleSettingsCard } from '../index'

vi.mock('@/ui/mrp/hooks/use-save-product-resale-configuration-action', () => ({
  useSaveProductResaleConfigurationAction: vi.fn(() => ({
    error: null,
    isPending: false,
    saveProductResaleConfiguration: vi.fn(),
  })),
}))

describe('ProductResaleSettingsCard', () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it('keeps Single Resale at one stock unit without a package field', () => {
    render(
      <ProductResaleSettingsCard
        details={{
          mode: 'resale-single',
          product: ProductFaker.fake({ categories: ['resale'], stockControl: 'single' }),
          resale: [{ isActive: false, packageQuantity: 1 }],
          sizes: [],
        }}
        productId='product-1'
      />,
    )

    expect(
      screen.getByText(
        'O produto é vendido avulso como uma unidade da unidade de estoque.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Preço de Revenda' })).toBeTruthy()
    expect(screen.getByLabelText('Preço de venda')).toBeTruthy()
    expect(screen.getByLabelText('Disponível no PDV')).toBeTruthy()
    expect(screen.getByText(/Cada venda baixa 1 unidade do estoque/)).toBeTruthy()
    expect(screen.queryByLabelText('Quantidade por embalagem')).toBeNull()
  })

  it('shows distinct guidance when By-brand has no brands', () => {
    render(
      <ProductResaleSettingsCard
        details={{
          mode: 'resale-by-brand',
          product: ProductFaker.fake({
            categories: ['resale'],
            stockControl: 'by-brand',
          }),
          resale: [],
          sizes: [],
        }}
        productId='product-1'
      />,
    )

    expect(screen.getByRole('heading', { name: 'Nenhuma marca cadastrada' })).toBeTruthy()
    expect(screen.getByText(/Cadastre uma marca em Estoque/)).toBeTruthy()
  })

  it('shows resale price and availability as read-only for Operators', () => {
    render(
      <ProductResaleSettingsCard
        canManage={false}
        details={{
          mode: 'resale-single',
          product: ProductFaker.fake({ categories: ['resale'], stockControl: 'single' }),
          resale: [{ isActive: true, packageQuantity: 1, price: 12.5 }],
          sizes: [],
        }}
        productId='product-1'
      />,
    )
    expect(screen.getByRole('heading', { name: 'Preço de Revenda' })).toBeTruthy()
    expect(screen.getByText(/12,50/)).toBeTruthy()
    expect(screen.getByText('Disponível')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('checkbox', { name: 'Disponível no PDV' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
  })
})
