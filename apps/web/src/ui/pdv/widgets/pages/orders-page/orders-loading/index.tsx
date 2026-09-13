import { Skeleton } from '@/ui/shadcn/skeleton'

export const OrdersLoading = () => (
  <section
    aria-label='Carregando pedidos'
    aria-live='polite'
    className='grid min-h-[420px] place-items-center rounded-2xl border border-border bg-card'
  >
    <div className='w-full space-y-3 p-5'>
      <Skeleton className='h-11 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
  </section>
)
