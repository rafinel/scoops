import { Button } from '@/ui/shadcn/button'

export type AccompanimentTypesErrorProps = {
  onRetry: () => void
}

export const AccompanimentTypesError = ({ onRetry }: AccompanimentTypesErrorProps) => (
  <div
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center'
    role='alert'
  >
    <h2 className='text-lg font-extrabold'>Não foi possível carregar os tipos</h2>
    <p className='mt-1 text-sm text-muted-foreground'>
      Tente novamente para consultar os tipos cadastrados.
    </p>
    <Button className='mt-4' onClick={onRetry} type='button' variant='outline'>
      Tentar novamente
    </Button>
  </div>
)
