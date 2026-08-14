import { All, Controller, Inject, OnModuleInit, Req, Res } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import type { Request, Response } from 'express'
import { serve } from 'inngest/express'
import type { InngestFunction } from 'inngest'

import {
  INNGEST_OPTIONS,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { PublicRoute } from '@/shared/rest/decorators/public-route'

@Controller('api/inngest')
@PublicRoute()
export class InngestController implements OnModuleInit {
  private handler!: ReturnType<typeof serve>

  constructor(
    @Inject(INNGEST_OPTIONS) private readonly options: InngestOptions,
    @Inject(InngestClient) private readonly inngest: InngestClient,
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const functions = this.options.functions.map((entry): InngestFunction.Like => {
      if (typeof entry !== 'function') return entry

      try {
        const job = this.moduleRef.get<InngestJob>(entry, { strict: false })

        if (job?.function) return job.function
      } catch {
        // Plain Inngest functions are not Nest providers.
      }

      return entry as unknown as InngestFunction.Like
    })
    this.handler = serve({ ...this.options, client: this.inngest, functions })
  }

  @All()
  handle(@Req() request: Request, @Res() response: Response) {
    return this.handler(request, response)
  }
}
