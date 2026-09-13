import { Skeleton } from '@/ui/shadcn/skeleton'

export const OrderDetailsLoading = () => (
  <section
    aria-label='Carregando detalhes do pedido'
    aria-live='polite'
    className='grid min-h-[520px] place-items-center rounded-2xl border border-border bg-card'
  >
    <div className='w-full space-y-4 p-5'>
      <Skeleton className='h-7 w-2/5' />
      <Skeleton className='h-40 w-full' />
      <Skeleton className='h-56 w-full' />
    </div>
  </section>
)
