import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ChangeUserProfileController } from '@/identity/rest/controllers/change-user-profile.controller'
import { ChangeOwnUserNameController } from '@/identity/rest/controllers/change-own-user-name.controller'
import { ChangeEstablishmentNameController } from '@/identity/rest/controllers/change-establishment-name.controller'
import { GetEstablishmentSettingsController } from '@/identity/rest/controllers/get-establishment-settings.controller'
import { GetAuthSessionController } from '@/identity/rest/controllers/get-auth-session.controller'
import { AuthenticationGuard } from '@/identity/rest/guards/authentication.guard'
import { ProfilesGuard } from '@/identity/rest/guards/profiles.guard'
import { IdentityProvisionModule } from '@/identity/provision/identity-provision.module'
import { IdentityMessagingModule } from '@/identity/messaging/identity-messaging.module'
import {
  ConfirmIceCreamShopOnboardingController,
  CorrectIceCreamShopOnboardingEmailController,
  GetIceCreamShopOnboardingController,
  RegisterIceCreamShopOnboardingController,
  ResendIceCreamShopConfirmationController,
  AcceptUserInvitationController,
  CancelUserInvitationController,
  ChangeUserStatusController,
  CorrectUserInvitationController,
  CorrectUserNameController,
  GetUserDetailsController,
  InviteUserController,
  ListUsersController,
  ResendUserInvitationController,
} from '@/identity/rest/controllers'
import { ProvisionModule } from '@/shared/provision/provision.module'

@Module({
  imports: [
    IdentityDatabaseModule,
    IdentityProvisionModule,
    IdentityMessagingModule,
    ProvisionModule,
  ],
  controllers: [
    GetAuthSessionController,
    ChangeUserProfileController,
    RegisterIceCreamShopOnboardingController,
    GetIceCreamShopOnboardingController,
    ResendIceCreamShopConfirmationController,
    CorrectIceCreamShopOnboardingEmailController,
    ConfirmIceCreamShopOnboardingController,
    ListUsersController,
    GetUserDetailsController,
    InviteUserController,
    CorrectUserInvitationController,
    ResendUserInvitationController,
    CancelUserInvitationController,
    AcceptUserInvitationController,
    ChangeUserStatusController,
    CorrectUserNameController,
    ChangeOwnUserNameController,
    GetEstablishmentSettingsController,
    ChangeEstablishmentNameController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ProfilesGuard,
    },
  ],
  exports: [IdentityDatabaseModule, IdentityProvisionModule, IdentityMessagingModule],
})
export class IdentityModule {}
