import { ApiProperty } from '@nestjs/swagger'

export type ServiceState = 'UP' | 'DOWN'

export class HealthServicesDto {
  @ApiProperty({ enum: ['UP', 'DOWN'] })
  database!: ServiceState

  @ApiProperty({ enum: ['UP', 'DOWN'] })
  @ApiProperty({ enum: ['UP', 'DOWN'] })
  storage!: ServiceState
}

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'not_ready'] })
  status!: 'ok' | 'not_ready'

  @ApiProperty()
  mode!: string

  @ApiProperty({ format: 'date-time' })
  timestamp!: string

  @ApiProperty({ type: HealthServicesDto })
  services!: HealthServicesDto
}

export class HealthErrorResponseDto extends HealthResponseDto {
  @ApiProperty()
  statusCode!: number
}
