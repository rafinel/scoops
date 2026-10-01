import { BackLink } from '@/ui/shared/widgets/components/back-link'

export type OrderDetailsHeadingProps = {
  sequence: string
  onBack: () => void
}

export const OrderDetailsHeading = ({ sequence, onBack }: OrderDetailsHeadingProps) => (
  <div>
    <BackLink aria-label='Voltar para pedidos' onClick={onBack} route='orders' />
    <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>Pedido #{sequence}</h1>
  </div>
)
