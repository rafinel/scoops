import type { Account } from '#identity/domain/entities/account.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'
import type { IceCreamShopOnboardingInput } from '#identity/domain/structures/ice-cream-shop-onboarding-input.ts'
import type { IceCreamShopOnboardingRegistration } from '#identity/domain/structures/ice-cream-shop-onboarding-registration.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import type { UserSummary } from '#identity/domain/structures/user-summary.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { UsersListParams } from '#identity/domain/structures/users-list-params.ts'

export interface IdentityService {
  getAccount(): Promise<RestResponse<Account>>
  registerIceCreamShop(
    request: IceCreamShopOnboardingInput,
  ): Promise<RestResponse<IceCreamShopOnboardingRegistration>>
  getIceCreamShopOnboarding(request: {
    continuationToken: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  resendIceCreamShopConfirmation(request: {
    continuationToken: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  correctIceCreamShopOnboardingEmail(request: {
    continuationToken: string
    email: string
    password: string
  }): Promise<RestResponse<PendingIceCreamShopOnboarding>>
  confirmIceCreamShopOnboarding(request: {
    confirmationToken: string
  }): Promise<RestResponse<void>>
  listUsers(
    input: Omit<UsersListParams, 'establishmentId' | 'excludeUserId'>,
  ): Promise<RestResponse<PaginationResponse<UserSummary>>>
  getUserDetails(userId: string): Promise<RestResponse<UserDetails>>
  inviteUser(input: {
    name: string
    email: string
    profile: UserProfile
  }): Promise<RestResponse<UserDetails>>
  correctUserInvitation(
    userId: string,
    input: { name: string; email: string; profile: UserProfile },
  ): Promise<RestResponse<UserDetails>>
  resendUserInvitation(userId: string): Promise<RestResponse<UserDetails>>
  cancelUserInvitation(userId: string): Promise<RestResponse<void>>
  acceptUserInvitation(input: { confirmationToken: string }): Promise<RestResponse<void>>
  changeUserProfile(
    userId: string,
    profile: UserProfile,
  ): Promise<RestResponse<UserDetails>>
  changeUserStatus(
    userId: string,
    status: Extract<UserStatus, 'active' | 'inactive'>,
  ): Promise<RestResponse<UserDetails>>
  correctUserName(userId: string, name: string): Promise<RestResponse<UserDetails>>
}
