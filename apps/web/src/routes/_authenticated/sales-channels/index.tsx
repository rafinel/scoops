import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/ui/shared/widgets/pages/placeholder-page'

export const Route = createFileRoute('/_authenticated/sales-channels/')({
  component: SalesChannelsPlaceholderRoute,
})

function SalesChannelsPlaceholderRoute() {
  return (
    <PlaceholderPage
      icon='store'
      title='Canais de venda'
      description='A configuração dos canais de venda estará disponível aqui em breve.'
    />
  )
}
