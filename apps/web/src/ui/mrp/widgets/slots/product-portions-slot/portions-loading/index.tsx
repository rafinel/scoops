import { Skeleton } from '@/ui/shadcn/skeleton'

export const PortionsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando porções'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-24 rounded-2xl' />
    <Skeleton className='h-72 rounded-2xl' />
  </div>
)
