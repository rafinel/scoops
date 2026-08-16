import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  UserAuditAction,
  UserAuditActorType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import { UserResponseDto } from '@/identity/rest/dtos/user-response.dto'

export class UserSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({ enum: Object.values(UserProfile) }) profile!: UserProfile
  @ApiProperty({ enum: Object.values(UserStatus) }) status!: UserStatus
  @ApiPropertyOptional({ format: 'date-time' }) lastAccessAt?: Date
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
}

export class UserAuditRecordResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) establishmentId!: string
  @ApiProperty({ format: 'uuid' }) affectedUserId!: string
  @ApiProperty() affectedUserName!: string
  @ApiProperty({ enum: Object.values(UserAuditActorType) }) actorType!: UserAuditActorType
  @ApiPropertyOptional({ format: 'uuid' }) actorUserId?: string
  @ApiProperty() actorName!: string
  @ApiProperty({ enum: Object.values(UserAuditAction) }) action!: UserAuditAction
  @ApiPropertyOptional() previousValue?: string
  @ApiPropertyOptional() newValue?: string
  @ApiProperty({ format: 'date-time' }) occurredAt!: Date
}

export class UserDetailsResponseDto {
  @ApiProperty({ type: () => UserResponseDto }) user!: UserResponseDto
  @ApiProperty({ type: () => UserAuditRecordResponseDto, isArray: true })
  auditRecords!: UserAuditRecordResponseDto[]
}

export class UsersPaginationResponseDto {
  @ApiProperty({ type: () => UserSummaryResponseDto, isArray: true })
  items!: UserSummaryResponseDto[]
  @ApiProperty() page!: number
  @ApiProperty() pageSize!: number
  @ApiProperty() total!: number
  @ApiProperty() totalPages!: number
}
