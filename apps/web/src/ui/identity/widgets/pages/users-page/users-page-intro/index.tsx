import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type UsersPageIntroProps = {
  isRefreshing: boolean
  total: number
}

export const UsersPageIntro = ({ isRefreshing, total }: UsersPageIntroProps) => (
  <div>
    <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>
      Usuários{' '}
      <span className='text-lg font-semibold text-muted-foreground'>({total})</span>
    </h1>
    <p className='mt-1 text-sm font-medium text-muted-foreground'>
      Cadastre pessoas e gerencie quem pode operar ou administrar a sorveteria.
    </p>
    <QueryRefreshStatus isRefreshing={isRefreshing} />
  </div>
)
