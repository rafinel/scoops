import { Global, type DynamicModule, Module } from '@nestjs/common'

import { SharedMessagingModule } from '@/shared/messaging/shared-messaging.module'
import {
  INNGEST_OPTIONS,
  type InngestOptions,
} from '@/shared/messaging/inngest/inngest-options'

@Global()
@Module({})
export class InngestModule {
  static forRoot(options: InngestOptions): DynamicModule {
    return {
      module: InngestModule,
      imports: [SharedMessagingModule],
      providers: [{ provide: INNGEST_OPTIONS, useValue: options }],
      exports: [INNGEST_OPTIONS],
    }
  }
}
