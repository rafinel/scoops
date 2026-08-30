import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrdersErrorProps = { onRetry: () => void }

export const OrdersError = ({ onRetry }: OrdersErrorProps) => (
  <section
    className='grid min-h-[420px] place-items-center rounded-2xl border border-danger/20 bg-card p-8 text-center'
    role='alert'
  >
    <div>
      <Icon className='mx-auto size-9 text-danger' name='triangle-alert' />
      <h2 className='mt-4 font-extrabold'>Não foi possível carregar os pedidos.</h2>
      <p className='mt-2 text-sm text-muted-foreground'>
        Confira sua conexão e tente novamente.
      </p>
      <Button className='mt-5' onClick={onRetry} type='button' variant='outline'>
        Tentar novamente
      </Button>
    </div>
  </section>
)
