import { useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useActionUtils } from './action-utils'

export type ResetPasswordInput = { token: string; password: string }

export const useResetPasswordAction = () => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function reset(input: ResetPasswordInput) {
    setError(null)
    setIsPending(true)

    try {
      ensureSuccessfulResponse(await identityService.resetPassword(input))
    } catch (nextError) {
      const actionError = toActionError(nextError, 'Password reset failed')
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, reset }
}
