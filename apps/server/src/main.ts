import './register-paths'

import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from '@/app.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants'
import { getTrustedOrigins, isAllowedBetterAuthRoute } from '@/identity/provision/auth'
import { configureHttpApp } from '@/configure-http-app'
import { EnvProvider } from '@/shared/provision/env/env-provider'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })

  const openApiConfig = new DocumentBuilder()
    .setTitle('Scoops REST API')
    .setDescription('HTTP API for the Scoops platform')
    .setVersion('1.0')
    .build()
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig)

  SwaggerModule.setup('/docs', app, openApiDocument)

  const envProvider = app.get(EnvProvider)
  configureHttpApp(app, app.get(IDENTITY_PROVIDERS.betterAuth), {
    trustedOrigins: getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL')),
    isAllowedRoute: isAllowedBetterAuthRoute,
  })

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

bootstrap()
