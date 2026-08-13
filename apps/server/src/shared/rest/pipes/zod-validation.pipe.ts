import {
  UnprocessableEntityException,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common'
import type { ZodType } from 'zod'

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value)

    if (!result.success) {
      throw new UnprocessableEntityException({
        error: 'Invalid request',
        message: 'Invalid request.',
      })
    }

    return result.data
  }
}
