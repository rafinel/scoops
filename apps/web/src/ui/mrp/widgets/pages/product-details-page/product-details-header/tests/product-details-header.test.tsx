import { cleanup, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import {
  ProductCategory,
  ProductStockControl,
  ProductStatus,
} from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductDetailsHeader } from '../index'
import { useProductDetailsHeader } from '../use-product-details-header'

vi.mock('../use-product-details-header', () => ({
  useProductDetailsHeader: vi.fn(),
}))

const useProductDetailsHeaderMock = vi.mocked(useProductDetailsHeader)

describe('ProductDetailsHeader', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductDetailsHeaderMock.mockReturnValue({
      isCategoryGlobal: () => false,
      isGlobal: false,
    })
  })

  it('renders product identity, status, categories and stock control', () => {
    const product = ProductFaker.fake({
      name: 'Sorvete de morango',
      unit: 'kg',
      categories: [ProductCategory.Manufacturable, ProductCategory.Portion],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
    })
    render(<ProductDetailsHeader product={product} />)

    expect(screen.getByRole('heading', { name: 'Sorvete de morango' })).toBeTruthy()
    expect(screen.getByText('Unidade: kg')).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
    expect(screen.getByText('Fabricável')).toBeTruthy()
    expect(screen.getByText('Porção')).toBeTruthy()
    expect(screen.getByText('Controle de estoque: Único')).toBeTruthy()
  })

  it('marks inactive products and brand-controlled stock', () => {
    const product = ProductFaker.fake({
      status: ProductStatus.Inactive,
      stockControl: ProductStockControl.ByBrand,
      categories: [ProductCategory.Ingredient],
    })
    render(<ProductDetailsHeader product={product} />)

    expect(screen.getByText('Inativo')).toBeTruthy()
    expect(screen.getByText('Controle de estoque: Por marca')).toBeTruthy()
  })

  it('passes the product to the owning hook', () => {
    const product = ProductFaker.fake({ categories: [ProductCategory.Accompaniment] })
    render(<ProductDetailsHeader product={product} />)

    expect(useProductDetailsHeaderMock).toHaveBeenCalledWith({ product })
  })

  it('shows the Global tag inside the Accompaniment chip for a global Accompaniment', () => {
    useProductDetailsHeaderMock.mockReturnValue({
      isCategoryGlobal: (category) => category === ProductCategory.Accompaniment,
      isGlobal: true,
    })
    const product = ProductFaker.fake({
      categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
    })
    render(<ProductDetailsHeader product={product} />)

    const chip = screen.getByRole('button', { name: 'Acompanhamento global' })
    expect(chip.textContent).toContain('Acompanhamento')
    expect(chip.textContent).toContain('Global')
    expect(screen.getAllByText('Global')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Revenda' }).textContent).not.toContain(
      'Global',
    )
  })

  it('shows no tag for a non-global Accompaniment', () => {
    const product = ProductFaker.fake({ categories: [ProductCategory.Accompaniment] })
    render(<ProductDetailsHeader product={product} />)

    expect(screen.getByRole('button', { name: 'Acompanhamento' })).toBeTruthy()
    expect(screen.queryByText('Global')).toBeNull()
  })
})
