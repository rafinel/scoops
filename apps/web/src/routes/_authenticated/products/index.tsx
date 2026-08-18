import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import {
  ProductSortDirection,
  ProductSortField,
} from '@scoops/core/mrp/domain/structures'
import { ProductsPage } from '@/ui/mrp/widgets/pages/products-page'

const productsSearchSchema = z.object({
  search: z.string().catch(''),
  categories: z
    .array(z.enum(['ingredient', 'manufacturable', 'portion', 'accompaniment', 'resale']))
    .catch([]),
  status: z.enum(['active', 'inactive']).optional().catch(undefined),
  stockSituation: z.enum(['normal', 'low']).optional().catch(undefined),
  sortBy: z
    .enum(['createdAt', 'name', 'stockQuantity', 'brandCount', 'categories', 'unit'])
    .catch(ProductSortField.CreatedAt),
  sortDirection: z.enum(['asc', 'desc']).catch(ProductSortDirection.Descending),
  page: z.coerce.number().int().min(1).catch(1),
})

export const Route = createFileRoute('/_authenticated/products/')({
  validateSearch: productsSearchSchema,
  component: ProductsRoute,
})

function ProductsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <ProductsPage
      search={search}
      onSearchChange={(nextSearch) => navigate({ search: nextSearch })}
    />
  )
}
