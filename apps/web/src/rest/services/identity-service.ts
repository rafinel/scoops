import type { Account, User } from '@scoops/core/identity/domain/entities'
import type {
  IceCreamShopOnboardingInput,
  EstablishmentSettings,
  UserDetails,
  UserProfile,
  UserStatus,
  UsersListParams,
} from '@scoops/core/identity/domain/structures'
import type { IdentityService as IdentityRestService } from '@scoops/core/identity/interfaces'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'
import type { RestClient } from '@scoops/core/shared/interfaces'

import {
  EstablishmentSettingsMapper,
  IceCreamShopOnboardingRegistrationMapper,
  PendingOnboardingResponseMapper,
  UserDetailsMapper,
  UserDetailsResponseMapper,
  UsersPageMapper,
  type EstablishmentSettingsJson,
  type IceCreamShopOnboardingRegistrationJson,
  type PaginationJson,
  type PendingIceCreamShopOnboardingJson,
  type UserDetailsJson,
  type UserSummaryJson,
} from '@/rest/mappers/identity'

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getAccount() {
      return restClient.get<Account>('/auth/session')
    },

    changeOwnUserName(name: string) {
      return restClient.patch<Account>('/auth/session/name', { name })
    },

    async getEstablishmentSettings() {
      const response = await restClient.get<EstablishmentSettingsJson>(
        '/establishments/current',
      )
      if (!response.isSuccessful) {
        return response as unknown as RestResponse<EstablishmentSettings>
      }

      return new RestResponse({
        body: EstablishmentSettingsMapper(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async changeEstablishmentName(name: string) {
      const response = await restClient.patch<EstablishmentSettingsJson>(
        '/establishments/current/name',
        { name },
      )
      if (!response.isSuccessful) {
        return response as unknown as RestResponse<EstablishmentSettings>
      }

      return new RestResponse({
        body: EstablishmentSettingsMapper(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async registerIceCreamShop(request: IceCreamShopOnboardingInput) {
      const response = await restClient.post<IceCreamShopOnboardingRegistrationJson>(
        '/registration-attempts/onboarding',
        request,
      )

      if (!response.isSuccessful) return response

      return new RestResponse({
        body: IceCreamShopOnboardingRegistrationMapper(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async getIceCreamShopOnboarding({ continuationToken }) {
      return PendingOnboardingResponseMapper(
        await restClient.post<PendingIceCreamShopOnboardingJson>(
          '/registration-attempts/onboarding/status',
          { continuationToken },
        ),
      )
    },

    async resendIceCreamShopConfirmation({ continuationToken }) {
      return PendingOnboardingResponseMapper(
        await restClient.post<PendingIceCreamShopOnboardingJson>(
          '/registration-attempts/onboarding/resend',
          { continuationToken },
        ),
      )
    },

    async correctIceCreamShopOnboardingEmail(request) {
      return PendingOnboardingResponseMapper(
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
        body: UsersPageMapper(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async getUserDetails(userId: string) {
      const response = await restClient.get<UserDetailsJson>(`/users/${userId}`)
      if (!response.isSuccessful) return response as unknown as RestResponse<UserDetails>

      return new RestResponse({
        body: UserDetailsMapper(response.body),
        statusCode: response.statusCode,
        headers: response.headers,
      })
    },

    async inviteUser(input: { name: string; email: string; profile: UserProfile }) {
      return UserDetailsResponseMapper(
        await restClient.post<UserDetailsJson>('/users/invitations', input),
      )
    },

    async correctUserInvitation(
      userId: string,
      input: { name: string; email: string; profile: UserProfile },
    ) {
      return UserDetailsResponseMapper(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/invitation`, input),
      )
    },

    async resendUserInvitation(userId: string) {
      return UserDetailsResponseMapper(
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
      return UserDetailsResponseMapper(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/profile`, { profile }),
      )
    },

    async changeUserStatus(
      userId: string,
      status: Extract<UserStatus, 'active' | 'inactive'>,
    ) {
      return UserDetailsResponseMapper(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/status`, { status }),
      )
    },

    async correctUserName(userId: string, name: string) {
      return UserDetailsResponseMapper(
        await restClient.patch<UserDetailsJson>(`/users/${userId}/name`, { name }),
      )
    },
  }
}
