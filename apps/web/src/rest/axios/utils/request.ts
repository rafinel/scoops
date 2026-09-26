import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import {
  getSafeErrorClass,
  logWebWarning,
  recordWebRequestDuration,
} from '@/provision/telemetry/sentry-telemetry-provider'

import { getErrorMessage } from './get-error-message'
import { normalizeHeaders } from './normalize-headers'

export async function request<ResponseBody>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
): Promise<RestResponse<ResponseBody>> {
  const startedAt = performance.now()
  let statusCode = 0

  try {
    const response = await client.request<ResponseBody>(config)
    statusCode = response.status

    return new RestResponse<ResponseBody>({
      body: response.data,
      statusCode: response.status,
      headers: normalizeHeaders(response.headers),
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status ?? 0
      if (statusCode === 0) logWebWarning('rest.request', 'NetworkError')

      return new RestResponse<ResponseBody>({
        body: error.response?.data as ResponseBody | undefined,
        statusCode: error.response?.status ?? 0,
        errorMessage: getErrorMessage(error.response?.data, error.message),
        headers: normalizeHeaders(error.response?.headers),
      })
    }

    logWebWarning('rest.request', getSafeErrorClass(error))

    return new RestResponse<ResponseBody>({
      statusCode: 0,
      errorMessage:
        error instanceof Error ? error.message : 'Erro desconhecido na requisição',
    })
  } finally {
    recordWebRequestDuration(performance.now() - startedAt, config.method, statusCode)
  }
}
