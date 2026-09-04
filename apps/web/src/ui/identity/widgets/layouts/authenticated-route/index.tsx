import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { ROUTES } from '@/constants/routes'
import { sanitizeReturnTo } from '@/middlewares/sanitize-return-to'
import { AuthRouteUnavailableState } from '@/ui/identity/widgets/states/auth-route-unavailable-state'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const AuthenticatedRoute = () => {
  const { status } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (
      status === 'resolving' ||
      status === 'authenticated' ||
      status === 'unavailable'
    ) {
      return
    }

    void navigate({
      hash: '',
      replace: true,
      search: {
        returnTo: sanitizeReturnTo(`${location.pathname}${location.searchStr}`),
      },
      to: ROUTES.login,
    })
  }, [location.pathname, location.searchStr, navigate, status])

  if (status === 'resolving') {
    return (
      <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
        <section
          aria-live='polite'
          className='w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-card sm:p-8'
        >
          <p className='text-sm font-extrabold uppercase tracking-[0.16em] text-primary'>
            Scoops
          </p>
          <h1 className='mt-4 text-xl font-extrabold'>Verificando seu acesso…</h1>
          <p className='mt-2 text-sm text-muted-foreground'>Aguarde um instante.</p>
        </section>
      </main>
    )
  }

  if (status === 'unavailable') {
    return (
      <AuthRouteUnavailableState message='O serviço de acesso está temporariamente indisponível.' />
    )
  }

  if (status !== 'authenticated') {
    return null
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
