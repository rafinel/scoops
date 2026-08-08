import { type DynamicModule, Module } from '@nestjs/common'

import { InngestController } from '@/shared/messaging/inngest/inngest-controller'
import {
  INNGEST_OPTIONS,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'

@Module({})
export class InngestModule {
  static forRoot(options: InngestOptions): DynamicModule {
    return {
      module: InngestModule,
      controllers: [InngestController],
      providers: [{ provide: INNGEST_OPTIONS, useValue: options }],
    }
  }
}
