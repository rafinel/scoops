import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  establishmentId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ format: 'email' })
  email!: string

  @ApiProperty({ enum: Object.values(UserProfile) })
  profile!: UserProfile

  @ApiProperty({ enum: Object.values(UserStatus) })
  status!: UserStatus

  @ApiPropertyOptional({ format: 'date-time' })
  lastAccessAt?: Date

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date
}
