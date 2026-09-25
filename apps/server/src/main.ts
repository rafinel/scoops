import './register-paths'
import '@/shared/provision/telemetry/sentry-init'

import { NestFactory } from '@nestjs/core'
import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from '@/app.module'
import { App } from '@/app'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { getTrustedOrigins, isAllowedBetterAuthRoute } from '@/identity/provision/auth'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'
import { SentryLogger } from '@/shared/provision/logger/sentry-logger'

export async function createApp(): Promise<INestApplication> {
  const nestApp = await NestFactory.create(AppModule, { bodyParser: false })
  // biome-ignore lint/correctness/useHookAtTopLevel: Nest's useLogger configures the HTTP app logger.
  nestApp.useLogger(nestApp.get(SentryLogger))
  const app = new App(nestApp)

  const openApiConfig = new DocumentBuilder()
    .setTitle('Scoops REST API')
    .setDescription('HTTP API for the Scoops platform')
    .setVersion('1.0')
    .build()
  const openApiDocument = SwaggerModule.createDocument(app.instance, openApiConfig)

  SwaggerModule.setup('/docs', app.instance, openApiDocument)

  const envProvider = app.instance.get(EnvProvider)
  app.configureHttpApp(app.instance.get(IDENTITY_PROVIDERS.betterAuth), {
    trustedOrigins: getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL')),
    isAllowedRoute: isAllowedBetterAuthRoute,
    operationalTelemetry: app.instance.get(TELEMETRY),
  })

  await app.instance.init()

  return app.instance
}

async function bootstrap() {
  const app = await createApp()
  const envProvider = app.get(EnvProvider)

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

void bootstrap()
