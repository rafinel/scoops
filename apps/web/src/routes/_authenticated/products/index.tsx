import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/products/')({
  component: ProductsPlaceholderRoute,
})

function ProductsPlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='package'
      title='Produtos'
      description='O catálogo de produtos estará disponível aqui em breve.'
    />
  )
}
