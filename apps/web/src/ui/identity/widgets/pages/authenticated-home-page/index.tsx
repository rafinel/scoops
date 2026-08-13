import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const AuthenticatedHomePage = () => {
  const { account } = useAuthContext()

  return (
    <section className='flex flex-1 items-center justify-center py-8'>
      <div className='w-full max-w-2xl rounded-xl border bg-card p-6 shadow-card sm:p-8'>
        <p className='text-sm font-extrabold uppercase tracking-[0.16em] text-primary'>
          Área da loja
        </p>
        <h1 className='mt-3 text-3xl font-extrabold tracking-tight'>
          Bem-vindo, {account?.name}
        </h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          Sua conta está pronta. Os módulos da operação aparecerão aqui quando forem
          disponibilizados.
        </p>
        <dl className='mt-6 grid gap-3 border-t pt-5 text-sm sm:grid-cols-2'>
          <div>
            <dt className='font-bold text-muted-foreground'>Email</dt>
            <dd className='mt-1 break-words'>{account?.email}</dd>
          </div>
          <div>
            <dt className='font-bold text-muted-foreground'>Perfil</dt>
            <dd className='mt-1'>
              {account?.profile === UserProfile.Manager ? 'Manager' : 'Operator'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
