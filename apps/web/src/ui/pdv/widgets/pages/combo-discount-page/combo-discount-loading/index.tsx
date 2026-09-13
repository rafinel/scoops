import { Skeleton } from '@/ui/shadcn/skeleton'

export const ComboDiscountLoading = () => (
  <div
    aria-label='Carregando combo'
    className='grid min-h-64 place-items-center rounded-2xl border border-border-soft bg-card text-sm text-muted-foreground'
    role='status'
  >
    <div className='w-full space-y-4 p-6'>
      <Skeleton className='h-7 w-2/5' />
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-40 w-full' />
    </div>
  </div>
)
