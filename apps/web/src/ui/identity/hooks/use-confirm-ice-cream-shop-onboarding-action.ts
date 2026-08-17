import { useState } from 'react'

import { IdentityService } from '@/rest/services/identity-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useActionUtils } from './action-utils'

export const useConfirmIceCreamShopOnboardingAction = () => {
  const { restClient } = useRestContext()
  const identityService = IdentityService(restClient)
  const { ensureSuccessfulResponse, toActionError } = useActionUtils()
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function confirmIceCreamShopOnboarding(confirmationToken: string): Promise<void> {
    setError(null)
    setIsPending(true)

    try {
      ensureSuccessfulResponse(
        await identityService.confirmIceCreamShopOnboarding({ confirmationToken }),
      )
    } catch (nextError) {
      const actionError = toActionError(nextError, 'Unable to confirm onboarding')
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, confirmIceCreamShopOnboarding }
}
