import { useRouter } from '@tanstack/react-router'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export function useAuthRouteUnavailableState() {
  const router = useRouter()
  const { retryLocalAccess } = useAuthContext()

  function handleRetry() {
    void retryLocalAccess().then(() => router.invalidate())
  }

  return { handleRetry }
}
