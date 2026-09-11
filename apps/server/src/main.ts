import './register-paths'

import { NestFactory } from '@nestjs/core'
import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from '@/app.module'
import { App } from '@/app'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { getTrustedOrigins, isAllowedBetterAuthRoute } from '@/identity/provision/auth'
import { EnvProvider } from '@/shared/provision/env/env-provider'

export async function createApp(): Promise<INestApplication> {
  const app = new App(await NestFactory.create(AppModule, { bodyParser: false }))

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
