import { healthResponseSchema } from '@hms/validation/shared'
import { createZodDto } from 'nestjs-zod'

export class HealthResponseDto extends createZodDto(healthResponseSchema) {}
