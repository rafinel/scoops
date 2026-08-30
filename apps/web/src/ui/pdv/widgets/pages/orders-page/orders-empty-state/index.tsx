import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrdersEmptyStateProps = { onNewSale: () => void }

export const OrdersEmptyState = ({ onNewSale }: OrdersEmptyStateProps) => (
  <section className='grid min-h-[520px] place-items-center rounded-2xl border border-border bg-card p-8 text-center'>
    <div>
      <Icon
        className='mx-auto size-14 rounded-2xl bg-accent p-3 text-primary'
        name='clipboard-list'
      />
      <h2 className='mt-5 text-lg font-extrabold'>Nenhum pedido registrado ainda</h2>
      <p className='mx-auto mt-2 max-w-md text-sm text-muted-foreground'>
        Registre sua primeira venda para começar a acompanhar pedidos, canais e valores
        neste histórico.
      </p>
      <Button className='mt-5 shadow-primary' onClick={onNewSale} type='button'>
        <Icon name='shopping-cart' /> Iniciar nova venda
      </Button>
    </div>
  </section>
)
