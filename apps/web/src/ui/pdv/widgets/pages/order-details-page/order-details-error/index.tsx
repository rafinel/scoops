import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderDetailsErrorProps = { onBack: () => void; onRetry: () => void }

export const OrderDetailsError = ({ onBack, onRetry }: OrderDetailsErrorProps) => (
  <section
    className='grid min-h-[420px] place-items-center rounded-2xl border border-danger/20 bg-card p-8 text-center'
    role='alert'
  >
    <div>
      <Icon className='mx-auto size-9 text-danger' name='triangle-alert' />
      <h1 className='mt-4 font-extrabold'>Pedido não encontrado</h1>
      <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
        Não foi possível carregar este pedido. Ele pode não existir ou não pertencer a
        esta sorveteria.
      </p>
      <div className='mt-5 flex justify-center gap-2'>
        <Button onClick={onRetry} type='button' variant='outline'>
          Tentar novamente
        </Button>
        <BackLink
          aria-label='Voltar para pedidos'
          onClick={(event) => {
            event.preventDefault()
            onBack()
          }}
          route='orders'
        >
          Voltar para pedidos
        </BackLink>
      </div>
    </div>
  </section>
)
