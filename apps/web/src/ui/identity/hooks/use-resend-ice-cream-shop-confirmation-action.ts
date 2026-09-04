import { useState } from 'react'

import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { IdentityService } from '@/rest/services/identity-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'

export const useResendIceCreamShopConfirmationAction = () => {
  // Resend remains a cookie-backed Identity action with no browser token state.
  const { restClient } = useRestContext()
  const identityService = IdentityService(restClient)
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function resendIceCreamShopConfirmation(
    continuationToken: string,
  ): Promise<PendingIceCreamShopOnboarding> {
    setError(null)
    setIsPending(true)

    try {
      return ensureSuccessfulResponse(
        await identityService.resendIceCreamShopConfirmation({ continuationToken }),
      )
    } catch (nextError) {
      const actionError = toActionError(nextError, 'Unable to resend confirmation')
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, resendIceCreamShopConfirmation }
}
