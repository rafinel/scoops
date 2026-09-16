import { ApiProperty } from '@nestjs/swagger'
import { EstablishmentStatus } from '@scoops/core/identity/domain/structures'
import type { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'

export class EstablishmentSettingsResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: false })
  establishment!: {
    id: string
    name: string
    status: EstablishmentStatus
    timeZone: EstablishmentTimezone
    createdAt: Date
    updatedAt: Date
  }

  @ApiProperty({ type: 'object', additionalProperties: false })
  responsibleManager!: {
    id: string
    name: string
  }
}
