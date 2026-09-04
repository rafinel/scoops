import { useEffect, useRef, useState } from 'react'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const useLogoutAction = () => {
  // Sign-out revokes the current server session; browser code never reads its value.
  const { signOut } = useAuthContext()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function logout() {
    if (isMountedRef.current) {
      setError(null)
      setIsPending(true)
    }

    try {
      await signOut()
    } catch (nextError) {
      if (isMountedRef.current) {
        setError(nextError instanceof Error ? nextError : new Error('Logout failed'))
      }
      throw nextError
    } finally {
      if (isMountedRef.current) setIsPending(false)
    }
  }

  return { error, isPending, logout }
}
