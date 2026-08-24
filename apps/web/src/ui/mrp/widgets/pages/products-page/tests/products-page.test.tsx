import { cleanup, render, screen } from '@testing-library/react'
import {
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ProductsPage } from '../index'
import { useProductsPage } from '../use-products-page'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../products-kpi-cards', () => ({ ProductsKpiCards: () => <div>kpis</div> }))
vi.mock('../products-list-card', () => ({
  ProductsListCard: () => <div>product-list</div>,
}))
vi.mock('../product-filters-dialog', () => ({ ProductFiltersDialog: () => null }))
vi.mock('../product-registration-dialog', () => ({
  ProductRegistrationDialog: () => null,
}))
vi.mock('../products-empty-state', () => ({ ProductsEmptyState: () => null }))
vi.mock('../use-products-page', () => ({ useProductsPage: vi.fn() }))

const useProductsPageMock = vi.mocked(useProductsPage)
const search = {
  search: '',
  categories: [],
  sortBy: ProductSortField.Name,
  sortDirection: ProductSortDirection.Ascending,
  page: 1,
}
const createPageState = (canManageTypes: boolean) => ({
  canManageTypes,
  hasProductsError: false,
  hasFilters: false,
  isFilterOpen: false,
  isLoadingProducts: false,
  isRegisterOpen: false,
  isPendingProducts: false,
  productsPage: undefined,
  handleEmptyStateClear: vi.fn(),
  handleFilterOpenChange: vi.fn(),
  handleOpenFilter: vi.fn(),
  handleRegisterOpenChange: vi.fn(),
  refetchProducts: vi.fn(),
})

describe('ProductsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useProductsPageMock.mockReturnValue(createPageState(true))
  })

  it('renders the catalog heading and manager-only type navigation', () => {
    render(<ProductsPage onSearchChange={vi.fn()} search={search} />)

    expect(screen.getByRole('heading', { name: 'Produtos' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Tipos de acompanhamento/ }).getAttribute('href'),
    ).toBe(ROUTES.accompanimentTypes)
    expect(screen.getByText('kpis')).toBeTruthy()
    expect(screen.getByText('product-list')).toBeTruthy()
  })

  it('hides type navigation for operators', () => {
    useProductsPageMock.mockReturnValue(createPageState(false))
    render(<ProductsPage onSearchChange={vi.fn()} search={search} />)
    expect(screen.queryByRole('link', { name: /Tipos de acompanhamento/ })).toBeNull()
  })
})
