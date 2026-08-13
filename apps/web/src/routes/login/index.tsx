import { createFileRoute } from '@tanstack/react-router'

import { sanitizeReturnTo } from '@/middlewares/sanitize-return-to'
import { LoginPage } from '@/ui/identity/widgets/pages/login-page'

type LoginSearch = {
  returnTo?: string
}

export const Route = createFileRoute('/login/')({
  validateSearch(search: Record<string, unknown>): LoginSearch {
    return { returnTo: sanitizeReturnTo(search.returnTo) }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { returnTo } = Route.useSearch()

  return <LoginPage returnTo={returnTo} />
}
