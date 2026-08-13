import type { Type } from '@nestjs/common'
import type { InngestFunction, ServeHandlerOptions } from 'inngest'

import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'

export type InngestOptions = Omit<ServeHandlerOptions, 'client' | 'functions'> & {
  functions: Array<InngestFunction.Like | Type<InngestJob>>
}

export const INNGEST_OPTIONS = Symbol('INNGEST_OPTIONS')
