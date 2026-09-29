import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const EditLoadError = ({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) => (
  <section className='grid min-h-64 place-items-center rounded-2xl border border-border-soft bg-card p-6 text-center'>
    <div>
      <Icon name='triangle-alert' className='mx-auto mb-3 size-8 text-destructive' />
      <h1 className='text-lg font-extrabold'>Não foi possível carregar o combo.</h1>
      <p className='mt-2 max-w-md text-sm text-muted-foreground'>
        {error instanceof Error
          ? error.message
          : 'Tente novamente ou volte para a lista de descontos.'}
      </p>
      <div className='mt-5 flex justify-center gap-2'>
        <Button onClick={onRetry} variant='outline'>
          Tentar novamente
        </Button>
        <BackLink aria-label='Voltar para descontos' route='discounts'>
          Voltar para descontos
        </BackLink>
      </div>
    </div>
  </section>
)
