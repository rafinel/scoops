import { errorResponseSchema } from '@hms/validation/shared'
import { createZodDto } from 'nestjs-zod'

export class ErrorResponseDto extends createZodDto(errorResponseSchema) {}
