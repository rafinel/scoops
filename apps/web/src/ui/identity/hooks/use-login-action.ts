import { useState } from 'react'

import type { AuthCredentials } from '@scoops/core/identity/domain/structures'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const useLoginAction = () => {
  const { signIn } = useAuthContext()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function login(credentials: AuthCredentials) {
    setError(null)
    setIsPending(true)

    try {
      await signIn(credentials)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error('Login failed'))
      throw nextError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, login }
}
