import { render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import {
  ProductCategory,
  ProductStockControl,
  ProductStatus,
} from '@scoops/core/mrp/domain/structures'
import { describe, expect, it } from 'vitest'

import { ProductDetailsHeader } from '../index'

describe('ProductDetailsHeader', () => {
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
})
