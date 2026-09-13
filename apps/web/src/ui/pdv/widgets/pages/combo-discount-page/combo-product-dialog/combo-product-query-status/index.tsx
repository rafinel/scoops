import { Skeleton } from '@/ui/shadcn/skeleton'
import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'

export type ComboProductQueryStatusProps = {
  isLoading: boolean
  isRefreshing: boolean
}

export const ComboProductQueryStatus = (props: ComboProductQueryStatusProps) => (
  <>
    {props.isLoading ? (
      <div aria-label='Carregando produtos' className='space-y-2' role='status'>
        {[1, 2, 3, 4].map((item) => (
          <Skeleton className='h-14 w-full rounded-xl' key={item} />
        ))}
      </div>
    ) : null}
    <PageRefreshStatus isRefreshing={props.isRefreshing} label='Atualizando produtos…' />
  </>
)
