import { Skeleton } from '@/ui/shadcn/skeleton'

export const SalesChannelsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando canais de venda'
    className='space-y-5'
    role='status'
  >
    <Skeleton className='h-20 rounded-2xl' />
    <Skeleton className='h-[330px] rounded-2xl' />
  </div>
)
