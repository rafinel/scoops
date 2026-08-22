import {
  ProductSortDirection,
  ProductSortField,
  type ProductSortField as ProductSortFieldType,
} from '@scoops/core/mrp/domain/structures'

import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'

const SORTABLE_COLUMNS: Array<{
  field: ProductSortFieldType
  label: string
  className?: string
  align?: 'left' | 'right'
}> = [
  { field: ProductSortField.Name, label: 'Produto' },
  { field: ProductSortField.Categories, label: 'Categorias' },
  { field: ProductSortField.Unit, label: 'Un.' },
  {
    field: ProductSortField.CreatedAt,
    label: 'Registrado em',
    className: 'hidden lg:table-cell',
  },
  {
    field: ProductSortField.BrandCount,
    label: 'Marcas',
    className: 'hidden sm:table-cell',
  },
  {
    field: ProductSortField.StockQuantity,
    label: 'Estoque',
    align: 'right',
  },
]

export function useProductsListCard({
  onSearchChange,
  search,
}: {
  onSearchChange: (search: ProductsSearch) => void
  search: ProductsSearch
}) {
  function handlePageChange(page: number) {
    onSearchChange({ ...search, page })
  }

  function handleSearch(value: string) {
    onSearchChange({ ...search, search: value, page: 1 })
  }

  function handleSort(field: ProductSortFieldType) {
    const isActive = search.sortBy === field
    onSearchChange({
      ...search,
      page: 1,
      sortBy: field,
      sortDirection:
        isActive && search.sortDirection === ProductSortDirection.Ascending
          ? ProductSortDirection.Descending
          : ProductSortDirection.Ascending,
    })
  }

  const filterCount =
    Number(search.categories.length > 0) +
    Number(search.status !== undefined) +
    Number(search.stockSituation !== undefined)

  return {
    filterCount,
    handlePageChange,
    handleSearch,
    handleSort,
    sortableColumns: SORTABLE_COLUMNS,
  }
}
