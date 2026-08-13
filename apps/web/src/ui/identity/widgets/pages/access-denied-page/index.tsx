import { AuthLayout } from '@/ui/identity/widgets/layouts/auth-layout'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export const AccessDeniedPage = () => {
  return (
    <AuthLayout visual='account-unconfirmed'>
      <div className='text-center'>
        <p className='text-sm font-extrabold uppercase tracking-[0.16em] text-destructive'>
          Acesso restrito
        </p>
        <h1 className='mt-3 text-2xl font-extrabold tracking-tight'>Acesso negado</h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          Você não tem permissão para visualizar este conteúdo.
        </p>
        <Anchor
          className='mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-extrabold text-primary-foreground shadow-primary'
          route='root'
        >
          Voltar para o início
        </Anchor>
      </div>
    </AuthLayout>
  )
}
