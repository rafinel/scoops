import { render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ProductTable } from '../index'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

const product = ProductFaker.fake({
  id: 'product-1',
  name: 'Polpa de morango',
  categories: [ProductCategory.Ingredient],
  idealStock: 10,
})
const page = {
  items: [{ product, brandCount: 2, stockQuantity: 4, stockSituation: 'low' as const }],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  kpis: { products: 1, brands: 2, lowStock: 1 },
}
const search = {
  search: '',
  categories: [],
  sortBy: ProductSortField.Name,
  sortDirection: ProductSortDirection.Ascending,
  page: 1,
}
const sortableColumns = [{ field: ProductSortField.Name, label: 'Produto' }]

describe('ProductTable', () => {
  it('renders product details, stock warning and sorting metadata', () => {
    render(
      <ProductTable
        onSort={vi.fn()}
        page={page}
        search={search}
        sortableColumns={sortableColumns}
      />,
    )

    expect(screen.getByRole('cell', { name: 'Polpa de morango' })).toBeTruthy()
    expect(
      screen.getByRole('columnheader', { name: /Produto/ }).getAttribute('aria-sort'),
    ).toBe('ascending')
    expect(screen.getByText('meta: 10 un')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Detalhes →' }).getAttribute('href')).toBe(
      ROUTES.productDetails,
    )
  })
})
