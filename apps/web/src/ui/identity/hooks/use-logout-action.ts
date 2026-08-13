import { useState } from 'react'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const useLogoutAction = () => {
  const { signOut } = useAuthContext()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function logout() {
    setError(null)
    setIsPending(true)

    try {
      await signOut()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error('Logout failed'))
      throw nextError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, logout }
}
