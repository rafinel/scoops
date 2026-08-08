import type { InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'

export abstract class InngestJob {
  abstract readonly function: InngestFunction.Like

  constructor(protected readonly inngest: InngestClient) {}
}
