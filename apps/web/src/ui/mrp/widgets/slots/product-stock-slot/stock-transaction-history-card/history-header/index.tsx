import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type HistoryHeaderProps = {
  isRefreshing: boolean
}

export const HistoryHeader = ({ isRefreshing }: HistoryHeaderProps) => (
  <div className='flex items-center gap-3'>
    <h2 className='text-lg font-extrabold'>Histórico de Movimentações</h2>
    <QueryRefreshStatus isRefreshing={isRefreshing} />
  </div>
)
