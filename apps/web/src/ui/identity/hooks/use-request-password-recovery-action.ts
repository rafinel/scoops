import { useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useActionUtils } from './action-utils'

export const useRequestPasswordRecoveryAction = () => {
  const { identityService } = useRestContext()
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function requestRecovery(email: string) {
    setError(null)
    setIsPending(true)

    try {
      ensureSuccessfulResponse(await identityService.requestPasswordRecovery({ email }))
    } catch (nextError) {
      const actionError = toActionError(
        nextError,
        'Não foi possível solicitar a recuperação da senha',
      )
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, requestRecovery }
}
