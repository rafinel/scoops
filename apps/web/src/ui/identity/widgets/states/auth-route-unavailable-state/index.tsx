import { useAuthRouteUnavailableState } from './use-auth-route-unavailable-state'

export type AuthRouteUnavailableStateProps = {
  message?: string
}

export const AuthRouteUnavailableState = ({
  message = 'Não foi possível verificar seu acesso agora.',
}: AuthRouteUnavailableStateProps) => {
  const { handleRetry } = useAuthRouteUnavailableState()

  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
      <section className='w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-card sm:p-8'>
        <h1 className='text-xl font-extrabold'>Acesso temporariamente indisponível</h1>
        <p className='mt-3 text-sm text-muted-foreground'>{message}</p>
        <button
          className='mt-6 min-h-11 rounded-lg bg-primary px-5 text-sm font-extrabold text-primary-foreground shadow-primary'
          onClick={handleRetry}
          type='button'
        >
          Tentar novamente
        </button>
      </section>
    </main>
  )
}
