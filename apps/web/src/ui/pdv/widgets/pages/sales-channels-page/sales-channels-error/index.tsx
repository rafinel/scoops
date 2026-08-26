import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type SalesChannelsErrorProps = {
  onRetry: () => void
}

export const SalesChannelsError = ({ onRetry }: SalesChannelsErrorProps) => (
  <section
    aria-live='assertive'
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center'
    role='alert'
  >
    <Icon className='mx-auto size-8 text-destructive' name='triangle-alert' />
    <h2 className='mt-3 text-lg font-extrabold'>Não foi possível carregar os canais</h2>
    <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
      Tente novamente para consultar os canais cadastrados.
    </p>
    <Button className='mt-5' onClick={onRetry} type='button' variant='outline'>
      Tentar novamente
    </Button>
  </section>
)
