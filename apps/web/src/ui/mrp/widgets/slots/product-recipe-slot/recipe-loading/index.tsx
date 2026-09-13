import { Skeleton } from '@/ui/shadcn/skeleton'

export const RecipeLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando receita'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-36 rounded-2xl' />
    <Skeleton className='h-96 rounded-2xl' />
  </div>
)
