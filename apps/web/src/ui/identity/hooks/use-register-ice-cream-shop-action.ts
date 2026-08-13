import { useState } from 'react'

import type {
  IceCreamShopOnboardingInput,
  IceCreamShopOnboardingRegistration,
} from '@scoops/core/identity/domain/structures'

import { IdentityService } from '@/rest/services/identity-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { ensureSuccessfulResponse, toActionError } from './action-utils'

export const useRegisterIceCreamShopAction = () => {
  const { restClient } = useRestContext()
  const identityService = IdentityService(restClient)
  const [error, setError] = useState<Error | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function registerIceCreamShop(
    input: IceCreamShopOnboardingInput,
  ): Promise<IceCreamShopOnboardingRegistration> {
    setError(null)
    setIsPending(true)

    try {
      return ensureSuccessfulResponse(await identityService.registerIceCreamShop(input))
    } catch (nextError) {
      const actionError = toActionError(nextError, 'Registration failed')
      setError(actionError)
      throw actionError
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, registerIceCreamShop }
}
