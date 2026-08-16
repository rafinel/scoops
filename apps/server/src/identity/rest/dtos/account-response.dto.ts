import { ApiProperty } from '@nestjs/swagger'
import { UserProfile } from '@scoops/core/identity/domain/structures'

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  establishmentId!: string

  @ApiProperty()
  establishmentName!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty({ enum: Object.values(UserProfile) })
  profile!: UserProfile
}
