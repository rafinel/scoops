import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type NotificationListStateName =
  | 'empty'
  | 'filtered-empty'
  | 'first-error'
  | 'loading'
  | 'next-error'
  | 'next-loading'

export type NotificationListStateProps = {
  onReset?: () => void
  onRetry?: () => void
  state: NotificationListStateName
}

export const NotificationListState = ({
  onReset,
  onRetry,
  state,
}: NotificationListStateProps) => {
  if (state === 'loading') {
    return (
      <div
        aria-label='Carregando notificações'
        aria-live='polite'
        className='space-y-3 p-5'
        role='status'
      >
        {['one', 'two', 'three'].map((skeleton) => (
          <div
            className='flex animate-pulse gap-4 py-3 motion-reduce:animate-none'
            key={skeleton}
          >
            <span className='size-10 shrink-0 rounded-full bg-muted' />
            <div className='min-w-0 flex-1 space-y-2'>
              <span className='block h-4 w-2/5 rounded bg-muted' />
              <span className='block h-3 w-4/5 rounded bg-muted' />
              <span className='block h-3 w-1/5 rounded bg-muted' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (state === 'next-loading') {
    return (
      <p
        aria-live='polite'
        className='border-t border-border-soft px-5 py-4 text-center text-sm text-muted-foreground'
      >
        Carregando mais notificações…
      </p>
    )
  }

  if (state === 'next-error') {
    return (
      <div className='border-t border-border-soft px-5 py-4 text-center' role='alert'>
        <p className='text-sm font-semibold text-danger'>
          Não foi possível carregar mais notificações.
        </p>
        <Button
          className='mt-3'
          onClick={onRetry}
          size='sm'
          type='button'
          variant='outline'
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (state === 'first-error') {
    return (
      <div className='grid min-h-72 place-items-center p-8 text-center' role='alert'>
        <div>
          <Icon className='mx-auto size-9 text-danger' name='triangle-alert' />
          <h2 className='mt-4 font-extrabold'>
            Não foi possível carregar as notificações.
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Confira sua conexão e tente novamente.
          </p>
          <Button className='mt-5' onClick={onRetry} type='button' variant='outline'>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (state === 'filtered-empty') {
    return (
      <div className='grid min-h-72 place-items-center p-8 text-center'>
        <div>
          <Icon
            className='mx-auto size-12 rounded-2xl bg-accent p-3 text-primary'
            name='bell'
          />
          <h2 className='mt-5 font-extrabold'>Nenhuma notificação neste período</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Tente consultar um período mais amplo para encontrar outros avisos.
          </p>
          <Button className='mt-5' onClick={onReset} type='button' variant='outline'>
            Ver últimos 30 dias
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='grid min-h-72 place-items-center p-8 text-center'>
      <div>
        <Icon
          className='mx-auto size-12 rounded-2xl bg-accent p-3 text-primary'
          name='bell'
        />
        <h2 className='mt-5 font-extrabold'>Nenhuma notificação ainda</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Alertas importantes da operação aparecerão aqui.
        </p>
      </div>
    </div>
  )
}
