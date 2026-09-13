import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrdersHeaderProps = {
  onNewSale: () => void
  total: number
}

export const OrdersHeader = (props: OrdersHeaderProps) => (
  <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
    <div>
      <h1 className='text-[28px] font-extrabold tracking-tight'>
        Pedidos{' '}
        <span className='text-lg font-semibold text-muted-foreground'>
          ({props.total})
        </span>
      </h1>
      <p className='mt-1 text-sm font-medium text-muted-foreground'>
        Consulte as vendas registradas ou canceladas e abra os detalhes de cada pedido.
      </p>
    </div>
    <Button
      className='min-h-11 rounded-[10px] px-4 font-extrabold shadow-primary'
      onClick={props.onNewSale}
      type='button'
    >
      <Icon name='shopping-cart' /> Nova venda
    </Button>
  </header>
)
