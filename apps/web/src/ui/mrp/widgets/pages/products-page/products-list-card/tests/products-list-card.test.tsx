import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import {
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ProductsListCard } from '../index'
import { useProductsListCard } from '../use-products-list-card'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../use-products-list-card', () => ({ useProductsListCard: vi.fn() }))
const useProductsListCardMock = vi.mocked(useProductsListCard)

const search = {
  search: '',
  categories: [],
  sortBy: ProductSortField.Name,
  sortDirection: ProductSortDirection.Ascending,
  page: 1,
}
const page = {
  items: [
    {
      product: ProductFaker.fake({ id: 'product-1', name: 'Polpa' }),
      brandCount: 1,
      stockQuantity: 3,
      stockSituation: 'normal' as const,
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  kpis: { products: 1, brands: 1, lowStock: 0 },
}

describe('ProductsListCard', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductsListCardMock.mockReturnValue({
      filterCount: 1,
      handlePageChange: vi.fn(),
      handleSearch: vi.fn(),
      handleSort: vi.fn(),
      sortableColumns: [{ field: ProductSortField.Name, label: 'Produto' }],
    })
  })

  it('renders the table and delegates search, filter and registration actions', () => {
    const onFilterOpen = vi.fn()
    const onRegisterOpen = vi.fn()
    render(
      <ProductsListCard
        emptyState={<p>empty</p>}
        isError={false}
        isPending={false}
        onFilterOpen={onFilterOpen}
        onRegisterOpen={onRegisterOpen}
        onRefetch={vi.fn()}
        onSearchChange={vi.fn()}
        page={page}
        search={search}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar produtos' }), {
      target: { value: 'polpa' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    fireEvent.click(screen.getByRole('button', { name: /Novo produto/ }))
    expect(
      useProductsListCardMock.mock.results[0].value.handleSearch,
    ).toHaveBeenCalledWith('polpa')
    expect(onFilterOpen).toHaveBeenCalledTimes(1)
    expect(onRegisterOpen).toHaveBeenCalledTimes(1)
  })

  it('renders pending, error recovery and empty states', () => {
    const onRefetch = vi.fn()
    const { rerender } = render(
      <ProductsListCard
        emptyState={<p>empty</p>}
        isError={false}
        isPending
        onFilterOpen={vi.fn()}
        onRegisterOpen={vi.fn()}
        onRefetch={onRefetch}
        onSearchChange={vi.fn()}
        search={search}
      />,
    )
    expect(screen.getByText('Carregando produtos...')).toBeTruthy()
    rerender(
      <ProductsListCard
        emptyState={<p>empty</p>}
        isError
        isPending={false}
        onFilterOpen={vi.fn()}
        onRegisterOpen={vi.fn()}
        onRefetch={onRefetch}
        onSearchChange={vi.fn()}
        search={search}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRefetch).toHaveBeenCalledTimes(1)
    rerender(
      <ProductsListCard
        emptyState={<p>empty</p>}
        isError={false}
        isPending={false}
        onFilterOpen={vi.fn()}
        onRegisterOpen={vi.fn()}
        onRefetch={onRefetch}
        onSearchChange={vi.fn()}
        page={{ ...page, items: [] }}
        search={search}
      />,
    )
    expect(screen.getByText('empty')).toBeTruthy()
  })
})
