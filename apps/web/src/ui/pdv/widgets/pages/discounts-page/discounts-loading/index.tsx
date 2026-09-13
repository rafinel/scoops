import { Skeleton } from '@/ui/shadcn/skeleton'

export const DiscountsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando descontos'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-24 rounded-2xl' />
    <Skeleton className='h-[390px] rounded-2xl' />
  </div>
)
