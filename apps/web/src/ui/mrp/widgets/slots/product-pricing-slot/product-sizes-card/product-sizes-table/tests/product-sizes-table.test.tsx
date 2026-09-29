import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductSizeFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductSizesTable } from '../index'

describe('ProductSizesTable', () => {
  afterEach(cleanup)
  it('renders unavailable projections as an em dash with an accessible label', () => {
    render(
      <ProductSizesTable
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        sizes={[{ size: ProductSizeFaker.fake() }]}
        unit='ml'
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Lucro' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Ações' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Editar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Remover/ })).toBeTruthy()
    expect(screen.getAllByRole('cell', { name: 'Indisponível' })).toHaveLength(3)
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('renders size facts without an action column for Operators', () => {
    render(
      <ProductSizesTable
        canManage={false}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        sizes={[{ size: ProductSizeFaker.fake({ name: '500 ml' }) }]}
        unit='ml'
      />,
    )
    expect(screen.getByRole('cell', { name: '500 ml' })).toBeTruthy()
    expect(screen.queryByRole('columnheader', { name: 'Ações' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar 500 ml' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remover 500 ml' })).toBeNull()
  })
})
