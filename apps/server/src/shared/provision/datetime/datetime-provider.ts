import { Injectable } from '@nestjs/common'

import type { DatetimeProvider as DatetimeProviderContract } from '@scoops/core/shared/interfaces'

@Injectable()
export class DatetimeProvider implements DatetimeProviderContract {
  now(): Date {
    return new Date()
  }
}
