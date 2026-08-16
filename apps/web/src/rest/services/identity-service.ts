import type {
  Account,
  User,
  UserAuditRecord,
} from '@scoops/core/identity/domain/entities'
import type {
  IceCreamShopOnboardingInput,
  IceCreamShopOnboardingRegistration,
  PendingIceCreamShopOnboarding,
  UserDetails,
  UserProfile,
  UserStatus,
  UsersListParams,
} from '@scoops/core/identity/domain/structures'
import type { IdentityService as IdentityRestService } from '@scoops/core/identity/interfaces'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
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

type UserJson = Omit<User, 'createdAt' | 'updatedAt' | 'lastAccessAt'> & {
  createdAt: string
  updatedAt: string
  lastAccessAt?: string
}

type UserAuditRecordJson = Omit<UserAuditRecord, 'occurredAt'> & {
  occurredAt: string
}

type UserDetailsJson = {
  user: UserJson
  auditRecords: readonly UserAuditRecordJson[]
}

type UserSummaryJson = Omit<User, 'createdAt' | 'updatedAt' | 'lastAccessAt'> & {
  createdAt: string
  lastAccessAt?: string
}

type PaginationJson<Item> = Omit<PaginationResponse<Item>, 'items'> & {
  items: readonly Item[]
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

function mapDate(value: string, fallbackMessage: string): Date {
  if (typeof value !== 'string') throw new AppError(fallbackMessage)

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new AppError(fallbackMessage)

  return date
}

function mapOptionalDate(value: string | undefined, fallbackMessage: string) {
  return value === undefined ? undefined : mapDate(value, fallbackMessage)
}

function mapUser(response: UserJson): User {
  return {
    ...response,
    createdAt: mapDate(response.createdAt, 'Unexpected user response'),
    updatedAt: mapDate(response.updatedAt, 'Unexpected user response'),
    lastAccessAt: mapOptionalDate(response.lastAccessAt, 'Unexpected user response'),
  }
}

function mapUserDetails(response: UserDetailsJson): UserDetails {
  if (!response?.user || !Array.isArray(response.auditRecords)) {
    throw new AppError('Unexpected user details response')
  }

  return {
    user: mapUser(response.user),
    auditRecords: response.auditRecords.map((record) => ({
      ...record,
      occurredAt: mapDate(record.occurredAt, 'Unexpected user audit response'),
    })),
  }
}

function mapUsersPage(
  response: PaginationJson<UserSummaryJson>,
): PaginationResponse<
  Pick<
    User,
    'id' | 'name' | 'email' | 'profile' | 'status' | 'lastAccessAt' | 'createdAt'
  >
> {
  if (!response || !Array.isArray(response.items)) {
    throw new AppError('Unexpected users response')
  }

  return new PaginationResponse(
    response.items.map((user) => ({
      ...user,
      createdAt: mapDate(user.createdAt, 'Unexpected users response'),
      lastAccessAt: mapOptionalDate(user.lastAccessAt, 'Unexpected users response'),
    })),
    response.page,
    response.pageSize,
    response.total,
    response.totalPages,
  )
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

    async listUsers(input: Omit<UsersListParams, 'establishmentId'>) {
      const params = new URLSearchParams()
      if (input.search) params.set('search', input.search)
      if (input.profile) params.set('profile', input.profile)
      if (input.status) params.set('status', input.status)
      params.set('page', String(input.page))
      params.set('pageSize', String(input.pageSize))

      const response = await restClient.get<PaginationJson<UserSummaryJson>>(
        `/users?${params.toString()}`,
      )

      if (!response.isSuccessful) {
        return response as unknown as RestResponse<
          PaginationResponse<
            Pick<
              User,
              | 'id'
              | 'name'
              | 'email'
              | 'profile'
              | 'status'
              | 'lastAccessAt'
              | 'createdAt'
            >
          >
        >
      }

      return new RestResponse({
        body: mapUsersPage(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async getUserDetails(userId: string) {
      const response = await restClient.get<UserDetailsJson>(`/users/${userId}`)
      if (!response.isSuccessful) return response as unknown as RestResponse<UserDetails>

      return new RestResponse({
        body: mapUserDetails(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async inviteUser(input: { name: string; email: string; profile: UserProfile }) {
      return mapUserDetailsResponse(
        await restClient.post<UserDetailsJson>('/users/invitations', input),
      )
    },

    async correctUserInvitation(
      userId: string,
      input: { name: string; email: string; profile: UserProfile },
    ) {
      return mapUserDetailsResponse(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/invitation`, input),
      )
    },

    async resendUserInvitation(userId: string) {
      return mapUserDetailsResponse(
        await restClient.post<UserDetailsJson>(`/users/${userId}/invitation/resend`),
      )
    },

    async cancelUserInvitation(userId: string) {
      return restClient.delete<void>(`/users/${userId}/invitation`)
    },

    async acceptUserInvitation(input: { confirmationToken: string }) {
      return restClient.post<void>('/registration-attempts/invitation/accept', input)
    },

    async changeUserProfile(userId: string, profile: UserProfile) {
      return mapUserDetailsResponse(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/profile`, { profile }),
      )
    },

    async changeUserStatus(
      userId: string,
      status: Extract<UserStatus, 'active' | 'inactive'>,
    ) {
      return mapUserDetailsResponse(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/status`, { status }),
      )
    },

    async correctUserName(userId: string, name: string) {
      return mapUserDetailsResponse(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/name`, { name }),
      )
    },
  }
}

async function mapUserDetailsResponse(
  response: RestResponse<UserDetailsJson>,
): Promise<RestResponse<UserDetails>> {
  if (!response.isSuccessful) return response as unknown as RestResponse<UserDetails>

  return new RestResponse({
    body: mapUserDetails(response.body),
    statusCode: response.statusCode,
    headers: response.headers,
  })
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
