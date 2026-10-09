import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { OrderPrint } from '@/ui/pdv/widgets/components/order-print'
import { Button, buttonVariants } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderConfirmationActionsProps = {
  order: OrderDetails
  onNewSale: () => void
}

export const OrderConfirmationActions = ({
  order,
  onNewSale,
}: OrderConfirmationActionsProps) => (
  <>
    <div className='mx-auto mt-6 grid w-full gap-3 sm:w-fit sm:grid-cols-3 [&>a]:h-10 [&>a]:w-full [&>button]:h-10 [&>button]:w-full'>
      <Anchor
        className={buttonVariants({ variant: 'outline' })}
        params={{ orderId: order.id }}
        route='orderDetails'
      >
        <Icon name='clipboard-list' /> Ver pedido
      </Anchor>
      <OrderPrint order={order} />
      <Button onClick={onNewSale} type='button'>
        <Icon name='plus' /> Iniciar nova venda
      </Button>
    </div>
    <p className='mt-4 text-center text-xs text-muted-foreground'>
      Este pedido também pode ser consultado em Pedidos.
    </p>
  </>
)
