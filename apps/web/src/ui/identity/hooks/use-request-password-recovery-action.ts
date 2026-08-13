import { useState } from 'react'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const useRequestPasswordRecoveryAction = () => {
  const { requestPasswordReset } = useAuthContext()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function requestRecovery(email: string) {
    setError(null)
    setIsPending(true)

    try {
      await requestPasswordReset(email)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError
          : new Error('Password recovery request failed'),
      )
      throw nextError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, requestRecovery }
}
