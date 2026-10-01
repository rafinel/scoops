import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderConfirmationHeadingProps = Record<string, never>

export const OrderConfirmationHeading = (_props: OrderConfirmationHeadingProps) => (
  <div className='text-center'>
    <span className='mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success'>
      <Icon name='circle-check' className='size-9' />
    </span>
    <h1 className='mt-5 text-3xl font-black tracking-tight' id='order-confirmation-title'>
      Pedido registrado
    </h1>
    <p className='mt-2 text-sm text-muted-foreground'>
      A venda foi concluída e já está disponível no histórico de pedidos.
    </p>
  </div>
)
