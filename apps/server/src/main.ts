import './register-paths'

import { ConfigModule } from '@nestjs/config'
import type { INestApplication } from '@nestjs/common'

const SERVER_ENV_FILE_PATHS = ['.env.local', '.env', '../../.env']

export async function createApp(): Promise<INestApplication> {
  await ConfigModule.forRoot({ envFilePath: SERVER_ENV_FILE_PATHS })
  await import('./shared/provision/telemetry/sentry-init.js')
  return createConfiguredApp()
}

async function createConfiguredApp(): Promise<INestApplication> {
  const {
    NestFactory,
    DocumentBuilder,
    SwaggerModule,
    AppModule,
    App,
    IDENTITY_PROVIDERS,
    getTrustedOrigins,
    isAllowedBetterAuthRoute,
    EnvProvider,
    TELEMETRY,
    SentryLogger,
  } = await loadBootstrapDependencies()

  const nestApp = await NestFactory.create(AppModule, { bodyParser: false })
  // biome-ignore lint/correctness/useHookAtTopLevel: Nest's useLogger configures the HTTP app logger.
  nestApp.useLogger(nestApp.get(SentryLogger))
  const app = new App(nestApp)

  setupSwagger(app.instance, DocumentBuilder, SwaggerModule)

  const envProvider = app.instance.get(EnvProvider)
  app.configureHttpApp(app.instance.get(IDENTITY_PROVIDERS.betterAuth), {
    trustedOrigins: getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL')),
    isAllowedRoute: isAllowedBetterAuthRoute,
    operationalTelemetry: app.instance.get(TELEMETRY),
  })

  await app.instance.init()

  return app.instance
}

function setupSwagger(
  app: INestApplication,
  DocumentBuilder: typeof import('@nestjs/swagger').DocumentBuilder,
  SwaggerModule: typeof import('@nestjs/swagger').SwaggerModule,
): void {
  const openApiConfig = new DocumentBuilder()
    .setTitle('Scoops REST API')
    .setDescription('HTTP API for the Scoops platform')
    .setVersion('1.0')
    .build()
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig)
  SwaggerModule.setup('/docs', app, openApiDocument)
}

async function loadBootstrapDependencies() {
  const [
    nestCore,
    nestSwagger,
    appModule,
    app,
    identityConstants,
    identityAuth,
    envProvider,
    telemetryProvider,
    sentryLogger,
  ] = await Promise.all([
    import('@nestjs/core'),
    import('@nestjs/swagger'),
    import('./app.module.js'),
    import('./app.js'),
    import('./identity/constants/index.js'),
    import('./identity/provision/auth/index.js'),
    import('./shared/provision/env/env-provider.js'),
    import('./shared/provision/telemetry/server-app-telemetry-provider.js'),
    import('./shared/provision/logger/sentry-logger.js'),
  ])

  return {
    NestFactory: nestCore.NestFactory,
    DocumentBuilder: nestSwagger.DocumentBuilder,
    SwaggerModule: nestSwagger.SwaggerModule,
    AppModule: appModule.AppModule,
    App: app.App,
    IDENTITY_PROVIDERS: identityConstants.IDENTITY_PROVIDERS,
    getTrustedOrigins: identityAuth.getTrustedOrigins,
    isAllowedBetterAuthRoute: identityAuth.isAllowedBetterAuthRoute,
    EnvProvider: envProvider.EnvProvider,
    TELEMETRY: telemetryProvider.TELEMETRY,
    SentryLogger: sentryLogger.SentryLogger,
  }
}

async function bootstrap() {
  const app = await createApp()
  const { EnvProvider } = await import('./shared/provision/env/env-provider.js')
  const envProvider = app.get(EnvProvider)

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

void bootstrap()
