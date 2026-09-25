import './register-paths'
import './shared/provision/telemetry/sentry-init.js'

import type { INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { App } from '@/app'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { getTrustedOrigins, isAllowedBetterAuthRoute } from '@/identity/provision/auth'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { SentryLogger } from '@/shared/provision/logger/sentry-logger'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

const SERVER_ENV_FILE_PATHS = ['.env.local', '.env', '../../.env']
const OPEN_API_CONFIG = new DocumentBuilder()
  .setTitle('Scoops REST API')
  .setDescription('HTTP API for the Scoops platform')
  .setVersion('1.0')
  .build()

export async function createApp(): Promise<INestApplication> {
  const { AppModule } = await loadAppModuleAfterSentry()
  const app = await createNestApplication(AppModule)

  setupSwagger(app.instance)

  const envProvider = app.instance.get(EnvProvider)
  app.configureHttpApp(app.instance.get(IDENTITY_PROVIDERS.betterAuth), {
    trustedOrigins: getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL')),
    isAllowedRoute: isAllowedBetterAuthRoute,
    operationalTelemetry: app.instance.get(TELEMETRY),
  })

  await app.instance.init()

  return app.instance
}

function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('/docs', app, SwaggerModule.createDocument(app, OPEN_API_CONFIG))
}

async function createNestApplication(
  AppModule: typeof import('./app.module.js').AppModule,
) {
  const nestApp = await NestFactory.create(AppModule, { bodyParser: false })
  // biome-ignore lint/correctness/useHookAtTopLevel: Nest's useLogger configures the HTTP app logger.
  nestApp.useLogger(nestApp.get(SentryLogger))
  return new App(nestApp)
}

async function loadAppModuleAfterSentry() {
  await ConfigModule.forRoot({ envFilePath: SERVER_ENV_FILE_PATHS })
  return import('./app.module.js')
}

async function bootstrap() {
  const app = await createApp()
  const envProvider = app.get(EnvProvider)

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

void bootstrap()
