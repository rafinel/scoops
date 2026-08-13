import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  IceCreamShopOnboardingInput,
  IceCreamShopOnboardingRegistration,
  PendingIceCreamShopOnboarding,
} from '@scoops/core/identity/domain/structures'
import type { IdentityService as IdentityRestService } from '@scoops/core/identity/interfaces'
import { AppError } from '@scoops/core/shared/domain/errors'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'

type PendingIceCreamShopOnboardingJson = Omit<
  PendingIceCreamShopOnboarding,
  'expiresAt'
> & { expiresAt: string }

const ISO_DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

function mapPendingOnboarding(
  response: PendingIceCreamShopOnboardingJson,
): PendingIceCreamShopOnboarding {
  if (
    !response ||
    typeof response.establishmentName !== 'string' ||
    typeof response.managerName !== 'string' ||
    typeof response.email !== 'string' ||
    typeof response.expiresAt !== 'string' ||
    !ISO_DATETIME_WITH_OFFSET.test(response.expiresAt)
  ) {
    throw new AppError('Unexpected onboarding response')
  }

  const expiresAt = new Date(response.expiresAt)
  if (!Number.isFinite(expiresAt.getTime())) {
    throw new AppError('Unexpected onboarding response')
  }

  return { ...response, expiresAt }
}

function mapRegistration(
  response: IceCreamShopOnboardingRegistration & {
    onboarding: PendingIceCreamShopOnboardingJson
  },
): IceCreamShopOnboardingRegistration {
  if (typeof response?.continuationToken !== 'string' || !response.onboarding) {
    throw new AppError('Unexpected onboarding response')
  }

  return {
    continuationToken: response.continuationToken,
    onboarding: mapPendingOnboarding(response.onboarding),
  }
}

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getAccount() {
      return restClient.get<Account>('/auth/session')
    },

    async registerIceCreamShop(request: IceCreamShopOnboardingInput) {
      const response = await restClient.post<
        IceCreamShopOnboardingRegistration & {
          onboarding: PendingIceCreamShopOnboardingJson
        }
      >('/registration-attempts/onboarding', request)

      if (!response.isSuccessful) return response

      return new RestResponse({
        body: mapRegistration(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async getIceCreamShopOnboarding({ continuationToken }) {
      return mapPendingResponse(
        await restClient.post<PendingIceCreamShopOnboardingJson>(
          '/registration-attempts/onboarding/status',
          { continuationToken },
        ),
      )
    },

    async resendIceCreamShopConfirmation({ continuationToken }) {
      return mapPendingResponse(
        await restClient.post<PendingIceCreamShopOnboardingJson>(
          '/registration-attempts/onboarding/resend',
          { continuationToken },
        ),
      )
    },

    async correctIceCreamShopOnboardingEmail(request) {
      return mapPendingResponse(
        await restClient.patch<PendingIceCreamShopOnboardingJson>(
          '/registration-attempts/onboarding/email',
          request,
        ),
      )
    },

    async confirmIceCreamShopOnboarding({ confirmationToken }) {
      return restClient.post<void>('/registration-attempts/onboarding/confirm', {
        confirmationToken,
      })
    },
  }
}

async function mapPendingResponse(
  response: RestResponse<PendingIceCreamShopOnboardingJson>,
): Promise<RestResponse<PendingIceCreamShopOnboarding>> {
  if (!response.isSuccessful) {
    return response as unknown as RestResponse<PendingIceCreamShopOnboarding>
  }

  return new RestResponse({
    body: mapPendingOnboarding(response.body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
}

export type { PendingIceCreamShopOnboardingJson }
