import {
  ProductSortDirection,
  ProductSortField,
  type ProductSortField as ProductSortFieldType,
} from '@scoops/core/mrp/domain/structures'
import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

import type { ProductsSearch } from '../../../../hooks/use-products-query'

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

export function formatStock(value: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat('pt-BR').format(value)} ${unit}`
}

export function formatRegisteredDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

export function useProductsListCard({
  onSearchChange,
  search,
}: {
  onSearchChange: (search: ProductsSearch) => void
  search: ProductsSearch
}) {
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

  return { handleSort, sortableColumns: SORTABLE_COLUMNS }
}
