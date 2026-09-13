import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type UserDetailsIntroProps = {
  isRefreshing: boolean
}

export const UserDetailsIntro = ({ isRefreshing }: UserDetailsIntroProps) => (
  <div>
    <h1 className='text-[26px] font-extrabold tracking-tight sm:text-[28px]'>
      Detalhe do usuário
    </h1>
    <p className='mt-1 text-sm font-medium text-muted-foreground'>
      Consulte dados, permissões e alterações desta conta.
    </p>
    <QueryRefreshStatus isRefreshing={isRefreshing} />
  </div>
)
