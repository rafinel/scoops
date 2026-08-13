import './register-paths'

import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from '@/app.module'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { GlobalErrorHandler } from '@/shared/rest/filters'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const openApiConfig = new DocumentBuilder()
    .setTitle('Scoops REST API')
    .setDescription('HTTP API for the Scoops platform')
    .setVersion('1.0')
    .build()
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig)

  SwaggerModule.setup('/docs', app, openApiDocument)

  // biome-ignore lint/correctness/useHookAtTopLevel: Nest global filter registration is not a React hook.
  app.useGlobalFilters(new GlobalErrorHandler(app.get(HttpAdapterHost)))

  const envProvider = app.get(EnvProvider)
  const webAppUrl = envProvider.get('SCOOPS_WEB_APP_URL')

  app.enableCors({
    origin: getAllowedWebOrigins(webAppUrl),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

function getAllowedWebOrigins(webAppUrl: string): string[] {
  const configuredUrl = new URL(webAppUrl)

  if (!['localhost', '127.0.0.1'].includes(configuredUrl.hostname)) {
    return [webAppUrl]
  }

  const loopbackHostname =
    configuredUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
  configuredUrl.hostname = loopbackHostname

  return [webAppUrl, configuredUrl.toString().replace(/\/$/, '')]
}

bootstrap()
