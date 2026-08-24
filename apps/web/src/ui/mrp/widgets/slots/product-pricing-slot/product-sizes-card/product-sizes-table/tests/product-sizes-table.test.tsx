import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductSizeFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductSizesTable } from '../index'

describe('ProductSizesTable', () => {
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
    expect(screen.getAllByRole('cell', { name: 'Indisponível' })).toHaveLength(3)
    expect(screen.getAllByText('—')).toHaveLength(3)
  })
})
