import { ApiProperty } from '@nestjs/swagger'
import type {
  IceCreamShopOnboardingRegistration,
  PendingIceCreamShopOnboarding,
} from '@scoops/core/identity/domain/structures'

export class PendingIceCreamShopOnboardingResponseDto {
  @ApiProperty()
  establishmentName!: string

  @ApiProperty()
  managerName!: string

  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string

  static fromDomain(
    onboarding: PendingIceCreamShopOnboarding,
  ): PendingIceCreamShopOnboardingResponseDto {
    const response = new PendingIceCreamShopOnboardingResponseDto()
    response.establishmentName = onboarding.establishmentName
    response.managerName = onboarding.managerName
    response.email = onboarding.email
    response.expiresAt = onboarding.expiresAt.toISOString()
    return response
  }
}

export class IceCreamShopOnboardingRegistrationResponseDto {
  @ApiProperty()
  continuationToken!: string

  @ApiProperty({ type: PendingIceCreamShopOnboardingResponseDto })
  onboarding!: PendingIceCreamShopOnboardingResponseDto

  static fromDomain(
    registration: IceCreamShopOnboardingRegistration,
  ): IceCreamShopOnboardingRegistrationResponseDto {
    const response = new IceCreamShopOnboardingRegistrationResponseDto()
    response.continuationToken = registration.continuationToken
    response.onboarding = PendingIceCreamShopOnboardingResponseDto.fromDomain(
      registration.onboarding,
    )
    return response
  }
}
