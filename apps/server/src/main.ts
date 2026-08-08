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

  app.enableCors({
    origin: envProvider.get('SCOOPS_WEB_APP_URL'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  await app.listen(envProvider.get('PORT') ?? envProvider.get('SCOOPS_SERVER_APP_PORT'))
}

bootstrap()
