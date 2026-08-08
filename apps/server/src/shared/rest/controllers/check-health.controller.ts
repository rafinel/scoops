import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import {
  HealthErrorResponseDto,
  HealthResponseDto,
  type ServiceState,
} from '@/shared/rest/dtos'

@Controller()
export class CheckHealthController {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly envProvider: EnvProvider,
  ) {}

  @Get('/health')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The application and its dependencies are healthy.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more application dependencies are unavailable.',
    type: HealthErrorResponseDto,
  })
  async handle(): Promise<HealthResponseDto> {
    const [database, supabase, storage] = await Promise.all([
      this.drizzleClient.isHealthy(),
      this.checkHttpService(this.envProvider.get('SUPABASE_URL'), '/auth/v1/health'),
      this.checkHttpService(this.envProvider.get('S3_ENDPOINT'), '/minio/health/live'),
    ])

    const services = {
      database: this.toServiceState(database),
      supabase: this.toServiceState(supabase),
      storage: this.toServiceState(storage),
    }
    const timestamp = new Date().toISOString()
    const mode = this.envProvider.get('SCOOPS_SERVER_APP_MODE')

    if (!database || !supabase || !storage) {
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'not_ready',
        mode,
        timestamp,
        services,
      })
    }

    return {
      status: 'ok',
      mode,
      timestamp,
      services,
    }
  }

  private async checkHttpService(baseUrl: string, path: string) {
    try {
      const response = await fetch(new URL(path, baseUrl), {
        signal: AbortSignal.timeout(1_000),
      })

      return response.ok
    } catch {
      return false
    }
  }

  private toServiceState(healthy: boolean): ServiceState {
    return healthy ? 'UP' : 'DOWN'
  }
}
