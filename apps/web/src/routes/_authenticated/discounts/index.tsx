import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/discounts/')({
  component: DiscountsPlaceholderRoute,
})

function DiscountsPlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='tags'
      title='Descontos'
      description='A configuração de descontos estará disponível aqui em breve.'
    />
  )
}
