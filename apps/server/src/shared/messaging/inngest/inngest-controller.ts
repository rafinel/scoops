import { All, Controller, Inject, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { serve } from 'inngest/express'

import {
  INNGEST_OPTIONS,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'
import { PublicRoute } from '@/shared/rest/decorators/public-route'

@Controller('api/inngest')
@PublicRoute()
export class InngestController {
  private readonly handler: ReturnType<typeof serve>

  constructor(@Inject(INNGEST_OPTIONS) options: InngestOptions) {
    this.handler = serve(options)
  }

  @All()
  handle(@Req() request: Request, @Res() response: Response) {
    return this.handler(request, response)
  }
}
