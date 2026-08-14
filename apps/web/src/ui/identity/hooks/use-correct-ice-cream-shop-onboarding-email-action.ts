import { useState } from 'react'

import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { IdentityService } from '@/rest/services/identity-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'

type CorrectEmailInput = {
  continuationToken: string
  email: string
  password: string
}

export const useCorrectIceCreamShopOnboardingEmailAction = () => {
  const { restClient } = useRestContext()
  const identityService = IdentityService(restClient)
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function correctIceCreamShopOnboardingEmail(
    input: CorrectEmailInput,
  ): Promise<PendingIceCreamShopOnboarding> {
    setError(null)
    setIsPending(true)

    try {
      return ensureSuccessfulResponse(
        await identityService.correctIceCreamShopOnboardingEmail(input),
      )
    } catch (nextError) {
      const actionError = toActionError(nextError, 'Unable to correct email')
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, correctIceCreamShopOnboardingEmail }
}

export type { CorrectEmailInput }
