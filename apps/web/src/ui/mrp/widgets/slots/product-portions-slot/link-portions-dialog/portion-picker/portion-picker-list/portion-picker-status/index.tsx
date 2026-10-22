import { Button } from '@/ui/shadcn/button'
import { Skeleton } from '@/ui/shadcn/skeleton'

export type PortionPickerStatusProps = {
  isError: boolean
  onRetry: () => void
}

export const PortionPickerStatus = ({ isError, onRetry }: PortionPickerStatusProps) =>
  isError ? (
    <div
      className='grid min-h-[120px] place-items-center gap-2 p-4 text-center'
      role='alert'
    >
      <span className='text-sm font-semibold text-destructive'>
        Não foi possível carregar as porções.
      </span>
      <Button onClick={onRetry} size='sm' type='button' variant='outline'>
        Tentar novamente
      </Button>
    </div>
  ) : (
    <div
      aria-busy='true'
      aria-label='Carregando porções'
      className='grid gap-3 p-3.5'
      role='status'
    >
      <Skeleton className='h-4 w-2/3' />
      <Skeleton className='h-4 w-1/2' />
      <Skeleton className='h-4 w-3/5' />
    </div>
  )
