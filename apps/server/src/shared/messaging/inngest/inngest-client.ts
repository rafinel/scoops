import { Inject, Injectable } from '@nestjs/common'
import { Inngest } from 'inngest'
import { extendedTracesMiddleware } from 'inngest/experimental'

import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class InngestClient extends Inngest {
  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    const mode = envProvider.get('SCOOPS_SERVER_APP_MODE')
    const middleware =
      mode === 'stg' || mode === 'prod'
        ? [extendedTracesMiddleware({ behaviour: 'extendProvider' })]
        : undefined

    super({
      id: 'scoops-server',
      isDev: envProvider.get('INNGEST_DEV') === '1',
      baseUrl: envProvider.get('INNGEST_BASE_URL'),
      eventKey: envProvider.get('INNGEST_EVENT_KEY'),
      signingKey: envProvider.get('INNGEST_SIGNING_KEY'),
      ...(middleware ? { middleware } : {}),
    })
  }
}
