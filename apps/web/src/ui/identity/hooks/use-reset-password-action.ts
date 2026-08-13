import { useState } from 'react'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export const useResetPasswordAction = () => {
  const { resetPassword } = useAuthContext()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function reset(password: string) {
    setError(null)
    setIsPending(true)

    try {
      await resetPassword(password)
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError : new Error('Password reset failed'),
      )
      throw nextError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, reset }
}
