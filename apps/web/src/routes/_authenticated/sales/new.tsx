import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/sales/new')({
  component: NewSalePlaceholderRoute,
})

function NewSalePlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='shopping-cart'
      title='Nova venda'
      description='O fluxo de criação de vendas estará disponível aqui em breve.'
    />
  )
}
