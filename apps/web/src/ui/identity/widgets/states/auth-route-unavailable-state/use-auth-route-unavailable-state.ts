import { useRouter } from '@tanstack/react-router'

export function useAuthRouteUnavailableState() {
  const router = useRouter()

  function handleRetry() {
    void router.invalidate()
  }

  return { handleRetry }
}
