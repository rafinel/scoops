import { Card, CardContent } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'

export const NewSaleCatalogLoading = () => (
  <div
    aria-label='Carregando produtos'
    className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
    role='status'
  >
    {[1, 2, 3, 4].map((item) => (
      <Card aria-hidden='true' className='rounded-2xl' key={item}>
        <CardContent className='flex min-h-44 flex-col p-4'>
          <div className='flex items-start justify-between gap-3'>
            <Skeleton className='size-10 rounded-xl' />
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
          <Skeleton className='mt-4 h-5 w-3/5' />
          <Skeleton className='mt-2 h-5 w-full' />
          <div className='mt-auto flex items-end justify-between gap-2 pt-4'>
            <Skeleton className='h-5 w-28' />
            <Skeleton className='h-6 w-20 rounded-full' />
          </div>
          <Skeleton className='mt-3 h-10 w-full rounded-lg' />
        </CardContent>
      </Card>
    ))}
  </div>
)
