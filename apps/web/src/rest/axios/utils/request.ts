import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

import type { AuthSession } from '@scoops/core/identity/domain/structures'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { getErrorMessage } from './get-error-message'
import { normalizeHeaders } from './normalize-headers'

export async function request<ResponseBody>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  sessionAccessor?: () => Promise<AuthSession | null>,
): Promise<RestResponse<ResponseBody>> {
  try {
    const session = sessionAccessor ? await sessionAccessor() : null
    const requestConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...(config.headers ?? {}),
        ...(sessionAccessor
          ? { Authorization: session ? `Bearer ${session.accessToken}` : undefined }
          : {}),
      },
    }
    const response = await client.request<ResponseBody>(requestConfig)

    return new RestResponse<ResponseBody>({
      body: response.data,
      statusCode: response.status,
      headers: normalizeHeaders(response.headers),
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return new RestResponse<ResponseBody>({
        body: error.response?.data as ResponseBody | undefined,
        statusCode: error.response?.status ?? 0,
        errorMessage: getErrorMessage(error.response?.data, error.message),
        headers: normalizeHeaders(error.response?.headers),
      })
    }

    return new RestResponse<ResponseBody>({
      statusCode: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown request error',
    })
  }
}
