import { createFileRoute } from '@tanstack/react-router'
import { productsSearchSchema } from '@scoops/validation'
import { ProductsPage } from '@/ui/mrp/widgets/pages/products-page'

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
